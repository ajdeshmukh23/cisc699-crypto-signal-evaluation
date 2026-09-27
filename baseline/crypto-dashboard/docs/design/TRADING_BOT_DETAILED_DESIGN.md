# Detailed Design Document - Sentiment-Driven Ensemble Trading Signal Bot

## 1. Data Ingestion Layer Detailed Design

### 1.1 Market Data Ingestion Service

#### 1.1.1 WebSocket Connection Manager
```python
class BinanceWebSocketManager:
    def __init__(self):
        self.base_url = "wss://stream.binance.com:9443"
        self.connections = {}
        self.reconnect_attempts = {}
        self.max_reconnect_attempts = 10
        self.reconnect_delay = 5  # seconds
        self.tokens = ['BTC', 'ETH', 'SOL', 'ADA']
        self.intervals = ['1m', '5m']
        
    async def connect(self):
        streams = []
        for token in self.tokens:
            for interval in self.intervals:
                streams.append(f"{token.lower()}usdt@kline_{interval}")
        
        stream_url = f"{self.base_url}/stream?streams={'/'.join(streams)}"
        
        try:
            self.ws = await websockets.connect(stream_url)
            await self.handle_messages()
        except Exception as e:
            await self.handle_reconnection(e)
    
    async def handle_messages(self):
        async for message in self.ws:
            try:
                data = json.loads(message)
                await self.process_kline_data(data)
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON received: {e}")
            except Exception as e:
                logger.error(f"Error processing message: {e}")
    
    async def process_kline_data(self, data):
        stream = data.get('stream', '')
        kline_data = data.get('data', {}).get('k', {})
        
        normalized_data = {
            'token': stream.split('usdt')[0].upper(),
            'interval': kline_data.get('i'),
            'open_time': kline_data.get('t'),
            'open': float(kline_data.get('o')),
            'high': float(kline_data.get('h')),
            'low': float(kline_data.get('l')),
            'close': float(kline_data.get('c')),
            'volume': float(kline_data.get('v')),
            'close_time': kline_data.get('T'),
            'is_closed': kline_data.get('x')
        }
        
        if normalized_data['is_closed']:
            await self.store_to_timeseries_db(normalized_data)
    
    async def handle_reconnection(self, error):
        token = "binance_ws"
        attempts = self.reconnect_attempts.get(token, 0)
        
        if attempts >= self.max_reconnect_attempts:
            logger.critical(f"Max reconnection attempts reached for {token}")
            raise error
        
        delay = self.reconnect_delay * (2 ** attempts)  # Exponential backoff
        logger.warning(f"Reconnecting {token} in {delay}s (attempt {attempts + 1})")
        
        await asyncio.sleep(delay)
        self.reconnect_attempts[token] = attempts + 1
        await self.connect()
```

#### 1.1.2 Time-Series Database Interface
```python
class TimeSeriesDB:
    def __init__(self):
        self.client = InfluxDBClient(
            url="http://influxdb:8086",
            token=os.environ.get("INFLUXDB_TOKEN"),
            org="crypto_trading",
            bucket="market_data"
        )
        self.write_api = self.client.write_api(write_options=SYNCHRONOUS)
    
    async def write_ohlcv(self, data: dict):
        point = Point("ohlcv") \
            .tag("token", data['token']) \
            .tag("interval", data['interval']) \
            .field("open", data['open']) \
            .field("high", data['high']) \
            .field("low", data['low']) \
            .field("close", data['close']) \
            .field("volume", data['volume']) \
            .time(data['open_time'], WritePrecision.MS)
        
        try:
            self.write_api.write(bucket="market_data", record=point)
        except Exception as e:
            logger.error(f"Failed to write to InfluxDB: {e}")
            raise
    
    async def query_ohlcv(self, token: str, interval: str, start: int, end: int):
        query = f'''
        from(bucket: "market_data")
            |> range(start: {start}, stop: {end})
            |> filter(fn: (r) => r["_measurement"] == "ohlcv")
            |> filter(fn: (r) => r["token"] == "{token}")
            |> filter(fn: (r) => r["interval"] == "{interval}")
            |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
        '''
        
        result = self.client.query_api().query(query=query)
        return self._process_query_result(result)
```

### 1.2 Text Data Ingestion Pipeline

#### 1.2.1 News Fetcher Service
```python
class CryptoControlFetcher:
    def __init__(self):
        self.api_key = os.environ.get("CRYPTOCONTROL_API_KEY")
        self.base_url = "https://cryptocontrol.io/api/v1/public/news/coin"
        self.rate_limiter = RateLimiter(max_calls=100, period=60)  # 100 req/min
        self.seen_headlines = LRUCache(maxsize=10000)
        self.kafka_producer = KafkaProducer(
            bootstrap_servers=['kafka:9092'],
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
    
    async def fetch_news(self):
        while True:
            for token in ['BTC', 'ETH', 'SOL', 'ADA']:
                try:
                    await self.rate_limiter.acquire()
                    news_items = await self._fetch_token_news(token)
                    await self._process_news_items(news_items, token)
                except Exception as e:
                    logger.error(f"Error fetching news for {token}: {e}")
            
            await asyncio.sleep(60)  # Poll every 60 seconds
    
    async def _fetch_token_news(self, token: str):
        headers = {'x-api-key': self.api_key}
        url = f"{self.base_url}/{token}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 429:  # Rate limited
                    retry_after = int(response.headers.get('Retry-After', 60))
                    await asyncio.sleep(retry_after)
                    return await self._fetch_token_news(token)
                
                response.raise_for_status()
                return await response.json()
    
    async def _process_news_items(self, news_items: list, token: str):
        for item in news_items:
            headline = item.get('title', '')
            headline_hash = hashlib.md5(headline.encode()).hexdigest()
            
            if headline_hash not in self.seen_headlines:
                self.seen_headlines[headline_hash] = True
                
                message = {
                    'source': 'cryptocontrol',
                    'tokenTags': [token],
                    'text': headline,
                    'url': item.get('url'),
                    'publishedAt': item.get('publishedAt'),
                    'timestamp': int(time.time() * 1000)
                }
                
                self.kafka_producer.send('raw-text', value=message)
```

#### 1.2.2 Twitter Streaming Service
```python
class TwitterStreamer:
    def __init__(self):
        self.bearer_token = os.environ.get("TWITTER_BEARER_TOKEN")
        self.stream_url = "https://api.twitter.com/2/tweets/search/stream"
        self.rules_url = "https://api.twitter.com/2/tweets/search/stream/rules"
        self.kafka_producer = KafkaProducer(
            bootstrap_servers=['kafka:9092'],
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        self.reconnect_attempts = 0
        self.max_reconnect_delay = 900  # 15 minutes
    
    async def setup_rules(self):
        rules = [
            {"value": "#BTC OR #Bitcoin", "tag": "BTC"},
            {"value": "#ETH OR #Ethereum", "tag": "ETH"},
            {"value": "#SOL OR #Solana", "tag": "SOL"},
            {"value": "#ADA OR #Cardano", "tag": "ADA"}
        ]
        
        headers = {"Authorization": f"Bearer {self.bearer_token}"}
        payload = {"add": rules}
        
        async with aiohttp.ClientSession() as session:
            async with session.post(self.rules_url, headers=headers, json=payload) as response:
                response.raise_for_status()
    
    async def stream_tweets(self):
        headers = {"Authorization": f"Bearer {self.bearer_token}"}
        params = {
            "tweet.fields": "created_at,author_id,context_annotations",
            "user.fields": "username,verified"
        }
        
        async with aiohttp.ClientSession() as session:
            while True:
                try:
                    async with session.get(self.stream_url, headers=headers, params=params) as response:
                        if response.status == 420:  # Rate limited
                            await self.handle_rate_limit()
                            continue
                        
                        response.raise_for_status()
                        self.reconnect_attempts = 0
                        
                        async for line in response.content:
                            if line:
                                await self.process_tweet(json.loads(line))
                
                except Exception as e:
                    await self.handle_reconnection(e)
    
    async def process_tweet(self, data):
        tweet = data.get('data', {})
        matching_rules = data.get('matching_rules', [])
        
        tokens = [rule['tag'] for rule in matching_rules]
        
        message = {
            'source': 'twitter',
            'tokenTags': tokens,
            'text': tweet.get('text', ''),
            'author_id': tweet.get('author_id'),
            'created_at': tweet.get('created_at'),
            'timestamp': int(time.time() * 1000)
        }
        
        self.kafka_producer.send('raw-text', value=message)
    
    async def handle_rate_limit(self):
        logger.warning("Twitter rate limit hit, disconnecting for 15 minutes")
        await asyncio.sleep(self.max_reconnect_delay)
    
    async def handle_reconnection(self, error):
        self.reconnect_attempts += 1
        delay = min(5 * (2 ** self.reconnect_attempts), self.max_reconnect_delay)
        logger.warning(f"Reconnecting Twitter stream in {delay}s")
        await asyncio.sleep(delay)
```

#### 1.2.3 Reddit Polling Service
```python
class RedditPoller:
    def __init__(self):
        self.client_id = os.environ.get("REDDIT_CLIENT_ID")
        self.client_secret = os.environ.get("REDDIT_CLIENT_SECRET")
        self.user_agent = "CryptoSignalBot/1.0"
        self.subreddit = "CryptoCurrency"
        self.rate_limiter = RateLimiter(max_calls=60, period=60)  # 60 req/min
        self.seen_ids = set()
        self.kafka_producer = KafkaProducer(
            bootstrap_servers=['kafka:9092'],
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
    
    async def authenticate(self):
        auth = aiohttp.BasicAuth(self.client_id, self.client_secret)
        data = {
            'grant_type': 'client_credentials',
            'device_id': 'DO_NOT_TRACK_THIS_DEVICE'
        }
        headers = {'User-Agent': self.user_agent}
        
        async with aiohttp.ClientSession() as session:
            async with session.post('https://www.reddit.com/api/v1/access_token',
                                  auth=auth, data=data, headers=headers) as response:
                token_data = await response.json()
                self.access_token = token_data['access_token']
    
    async def poll_subreddit(self):
        while True:
            try:
                await self.rate_limiter.acquire()
                
                # Fetch new posts
                posts = await self._fetch_new_posts()
                for post in posts:
                    await self._process_reddit_item(post, 'post')
                
                # Fetch new comments
                comments = await self._fetch_new_comments()
                for comment in comments:
                    await self._process_reddit_item(comment, 'comment')
                
            except Exception as e:
                logger.error(f"Error polling Reddit: {e}")
            
            await asyncio.sleep(30)  # Poll every 30 seconds
    
    async def _fetch_new_posts(self):
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'User-Agent': self.user_agent
        }
        url = f"https://oauth.reddit.com/r/{self.subreddit}/new.json?limit=25"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 429:
                    retry_after = int(response.headers.get('X-Ratelimit-Reset', 60))
                    await asyncio.sleep(retry_after)
                    return []
                
                data = await response.json()
                return data['data']['children']
    
    async def _process_reddit_item(self, item, item_type):
        data = item['data']
        item_id = data['id']
        
        if item_id in self.seen_ids:
            return
        
        self.seen_ids.add(item_id)
        
        # Extract token mentions
        text = data.get('title', '') + ' ' + data.get('selftext', '') if item_type == 'post' else data.get('body', '')
        tokens = self._extract_token_mentions(text)
        
        if tokens:
            message = {
                'source': 'reddit',
                'tokenTags': tokens,
                'text': text,
                'author': data.get('author'),
                'created_utc': data.get('created_utc'),
                'timestamp': int(time.time() * 1000),
                'item_type': item_type
            }
            
            self.kafka_producer.send('raw-text', value=message)
    
    def _extract_token_mentions(self, text):
        text_upper = text.upper()
        tokens = []
        
        token_patterns = {
            'BTC': ['BTC', 'BITCOIN'],
            'ETH': ['ETH', 'ETHEREUM'],
            'SOL': ['SOL', 'SOLANA'],
            'ADA': ['ADA', 'CARDANO']
        }
        
        for token, patterns in token_patterns.items():
            if any(pattern in text_upper for pattern in patterns):
                tokens.append(token)
        
        return tokens
```

### 1.3 Feature Engineering Services

#### 1.3.1 Sentiment Analyzer (GPU-Accelerated)
```python
class SentimentAnalyzer:
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model_name = "ProsusAI/finbert"
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
        self.model.to(self.device)
        self.model.eval()
        
        # TensorRT optimization for production
        if torch.cuda.is_available():
            self.model = torch.jit.script(self.model)
        
        self.kafka_consumer = KafkaConsumer(
            'raw-text',
            bootstrap_servers=['kafka:9092'],
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            group_id='sentiment-analyzer'
        )
        
        self.feature_store = FeatureStore()
    
    async def process_texts(self):
        batch = []
        batch_timeout = 0.5  # seconds
        max_batch_size = 32
        
        while True:
            try:
                # Collect messages for batch processing
                start_time = time.time()
                while len(batch) < max_batch_size and (time.time() - start_time) < batch_timeout:
                    message = self.kafka_consumer.poll(timeout_ms=100)
                    if message:
                        for topic_partition, records in message.items():
                            batch.extend(records)
                
                if batch:
                    await self._process_batch(batch)
                    batch = []
                    
            except Exception as e:
                logger.error(f"Error in sentiment processing: {e}")
    
    async def _process_batch(self, batch):
        texts = [record.value['text'] for record in batch]
        
        # Tokenize batch
        inputs = self.tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=512,
            return_tensors='pt'
        ).to(self.device)
        
        # GPU inference
        with torch.no_grad():
            outputs = self.model(**inputs)
            predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
        
        # Convert to sentiment scores [-1, 1]
        sentiment_scores = self._convert_to_sentiment_scores(predictions)
        
        # Store results
        for i, record in enumerate(batch):
            sentiment_data = {
                'source': record.value['source'],
                'tokens': record.value['tokenTags'],
                'sentiment_score': float(sentiment_scores[i]),
                'timestamp': record.value['timestamp']
            }
            
            await self.feature_store.store_sentiment(sentiment_data)
    
    def _convert_to_sentiment_scores(self, predictions):
        # FinBERT outputs: [negative, neutral, positive]
        # Convert to single score in [-1, 1]
        scores = predictions.cpu().numpy()
        sentiment_scores = scores[:, 2] - scores[:, 0]  # positive - negative
        return sentiment_scores
```

#### 1.3.2 Technical Indicator Calculator (GPU-Accelerated)
```python
import cupy as cp  # GPU-accelerated NumPy

class TechnicalIndicatorCalculator:
    def __init__(self):
        self.feature_store = FeatureStore()
        self.timeseries_db = TimeSeriesDB()
        
    async def calculate_indicators(self, token: str, interval: str):
        # Fetch recent OHLCV data
        end_time = int(time.time() * 1000)
        start_time = end_time - (100 * self._get_interval_ms(interval))  # 100 periods
        
        ohlcv_data = await self.timeseries_db.query_ohlcv(token, interval, start_time, end_time)
        
        if len(ohlcv_data) < 30:  # Minimum data requirement
            return
        
        # Convert to GPU arrays
        close_prices = cp.array([d['close'] for d in ohlcv_data])
        high_prices = cp.array([d['high'] for d in ohlcv_data])
        low_prices = cp.array([d['low'] for d in ohlcv_data])
        volumes = cp.array([d['volume'] for d in ohlcv_data])
        
        # Calculate indicators in parallel on GPU
        indicators = {
            'RSI': self._calculate_rsi_gpu(close_prices),
            'MACD': self._calculate_macd_gpu(close_prices),
            'BollingerBands': self._calculate_bollinger_gpu(close_prices),
            'VWAP': self._calculate_vwap_deviation_gpu(close_prices, volumes)
        }
        
        # Store features
        feature_data = {
            'token': token,
            'interval': interval,
            'timestamp': ohlcv_data[-1]['open_time'],
            f'RSI{interval}': float(indicators['RSI']),
            f'MACD{interval}': float(indicators['MACD']['macd']),
            f'MACD_signal{interval}': float(indicators['MACD']['signal']),
            f'BollingerZ{interval}': float(indicators['BollingerBands']['z_score']),
            f'VWAPDeviation{interval}': float(indicators['VWAP'])
        }
        
        await self.feature_store.store_technical_features(feature_data)
    
    def _calculate_rsi_gpu(self, prices, period=14):
        deltas = cp.diff(prices)
        gains = cp.where(deltas > 0, deltas, 0)
        losses = cp.where(deltas < 0, -deltas, 0)
        
        avg_gain = self._sma_gpu(gains, period)
        avg_loss = self._sma_gpu(losses, period)
        
        rs = avg_gain / (avg_loss + 1e-10)  # Avoid division by zero
        rsi = 100 - (100 / (1 + rs))
        
        return rsi[-1]
    
    def _calculate_macd_gpu(self, prices, fast=12, slow=26, signal=9):
        ema_fast = self._ema_gpu(prices, fast)
        ema_slow = self._ema_gpu(prices, slow)
        
        macd_line = ema_fast - ema_slow
        signal_line = self._ema_gpu(macd_line, signal)
        
        return {
            'macd': macd_line[-1],
            'signal': signal_line[-1],
            'histogram': macd_line[-1] - signal_line[-1]
        }
    
    def _calculate_bollinger_gpu(self, prices, period=20, std_dev=2):
        sma = self._sma_gpu(prices, period)
        std = self._rolling_std_gpu(prices, period)
        
        upper_band = sma + (std_dev * std)
        lower_band = sma - (std_dev * std)
        
        # Calculate z-score of current price
        z_score = (prices[-1] - sma[-1]) / (std[-1] + 1e-10)
        
        return {
            'upper': upper_band[-1],
            'middle': sma[-1],
            'lower': lower_band[-1],
            'z_score': z_score
        }
    
    def _calculate_vwap_deviation_gpu(self, prices, volumes):
        typical_price = prices  # Using close price as typical price
        vwap = cp.sum(typical_price * volumes) / cp.sum(volumes)
        deviation = (prices[-1] - vwap) / vwap * 100
        
        return deviation
    
    def _ema_gpu(self, data, period):
        alpha = 2 / (period + 1)
        ema = cp.zeros_like(data)
        ema[0] = data[0]
        
        for i in range(1, len(data)):
            ema[i] = alpha * data[i] + (1 - alpha) * ema[i-1]
        
        return ema
    
    def _sma_gpu(self, data, period):
        return cp.convolve(data, cp.ones(period), 'valid') / period
    
    def _rolling_std_gpu(self, data, period):
        # Using cupy's rolling window implementation
        rolling_mean = self._sma_gpu(data, period)
        
        # Pad the beginning to match array size
        padded_mean = cp.concatenate([cp.full(period-1, rolling_mean[0]), rolling_mean])
        
        squared_diff = (data - padded_mean) ** 2
        variance = self._sma_gpu(squared_diff, period)
        
        return cp.sqrt(variance)
```

#### 1.3.3 Feature Aggregator
```python
class FeatureAggregator:
    def __init__(self):
        self.redis_client = redis.Redis(host='redis', port=6379, decode_responses=True)
        self.feature_store = FeatureStore()
        
    async def aggregate_sentiment_features(self, token: str):
        # Get recent sentiment scores from Redis (cached for speed)
        key_1m = f"sentiment:{token}:1m"
        key_5m = f"sentiment:{token}:5m"
        
        # Get scores for last 60 seconds (1-min window)
        current_time = int(time.time() * 1000)
        window_1m_start = current_time - 60000
        
        scores_1m = await self._get_sentiment_scores(token, window_1m_start, current_time)
        
        if scores_1m:
            mean_sentiment_1m = np.mean(scores_1m)
            
            # Get previous mean for momentum calculation
            prev_key = f"sentiment:{token}:1m:prev_mean"
            prev_mean = float(self.redis_client.get(prev_key) or 0)
            
            sentiment_momentum_1m = mean_sentiment_1m - prev_mean
            
            # Store current mean as previous for next calculation
            self.redis_client.setex(prev_key, 120, str(mean_sentiment_1m))
            
            # Store aggregated features
            features_1m = {
                'token': token,
                'interval': '1m',
                'timestamp': current_time,
                'meanSentiment1m': mean_sentiment_1m,
                'sentimentMomentum1m': sentiment_momentum_1m,
                'sentimentCount1m': len(scores_1m)
            }
            
            await self.feature_store.store_aggregated_features(features_1m)
        
        # Similar calculation for 5-min window
        window_5m_start = current_time - 300000
        scores_5m = await self._get_sentiment_scores(token, window_5m_start, current_time)
        
        if scores_5m:
            mean_sentiment_5m = np.mean(scores_5m)
            
            prev_key_5m = f"sentiment:{token}:5m:prev_mean"
            prev_mean_5m = float(self.redis_client.get(prev_key_5m) or 0)
            
            sentiment_momentum_5m = mean_sentiment_5m - prev_mean_5m
            
            self.redis_client.setex(prev_key_5m, 600, str(mean_sentiment_5m))
            
            features_5m = {
                'token': token,
                'interval': '5m',
                'timestamp': current_time,
                'meanSentiment5m': mean_sentiment_5m,
                'sentimentMomentum5m': sentiment_momentum_5m,
                'sentimentCount5m': len(scores_5m)
            }
            
            await self.feature_store.store_aggregated_features(features_5m)
    
    async def _get_sentiment_scores(self, token: str, start_time: int, end_time: int):
        # Query from feature store with time range
        sentiments = await self.feature_store.get_sentiments(token, start_time, end_time)
        return [s['sentiment_score'] for s in sentiments]
```

### 1.4 Model Layer Design

#### 1.4.1 Model Training Pipeline
```python
class ModelTrainer:
    def __init__(self):
        self.feature_store = FeatureStore()
        self.model_registry = ModelRegistry()
        
    async def train_models(self, start_date: str, end_date: str):
        # Load historical data
        data = await self._load_training_data(start_date, end_date)
        
        # Generate labels
        labeled_data = self._generate_labels(data)
        
        # Split features
        sentiment_features = self._extract_sentiment_features(labeled_data)
        technical_features = self._extract_technical_features(labeled_data)
        
        # Train base models
        sentiment_model = await self._train_sentiment_model(sentiment_features)
        technical_model = await self._train_technical_model(technical_features)
        
        # Generate base predictions for ensemble training
        sentiment_preds = sentiment_model.predict_proba(sentiment_features['X'])[:, 1]
        technical_preds = technical_model.predict_proba(technical_features['X'])[:, 1]
        
        # Train ensemble model
        ensemble_features = self._prepare_ensemble_features(
            labeled_data, sentiment_preds, technical_preds
        )
        ensemble_model = await self._train_ensemble_model(ensemble_features)
        
        # Calibrate probabilities
        calibrated_model = await self._calibrate_model(ensemble_model, ensemble_features)
        
        # Save models to registry
        model_version = f"v{int(time.time())}"
        await self.model_registry.save_models({
            'sentiment_model': sentiment_model,
            'technical_model': technical_model,
            'ensemble_model': ensemble_model,
            'calibration_params': calibrated_model['params'],
            'version': model_version,
            'training_date': datetime.now().isoformat()
        })
        
        return model_version
    
    def _generate_labels(self, data):
        """Generate binary labels based on future price movement"""
        labeled_data = []
        
        for i in range(len(data) - 60):  # Need future data for labeling
            current = data[i]
            
            # 5-minute horizon
            future_5m = data[i + 5]  # 5 minutes later (assuming 1-min data)
            label_5m = 1 if future_5m['close'] > current['close'] else 0
            
            # 1-hour horizon
            future_1h = data[i + 60]  # 60 minutes later
            label_1h = 1 if future_1h['close'] > current['close'] else 0
            
            current['label_5m'] = label_5m
            current['label_1h'] = label_1h
            labeled_data.append(current)
        
        return labeled_data
    
    async def _train_sentiment_model(self, features):
        model = XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            gpu_id=0,  # Use GPU
            tree_method='gpu_hist',
            predictor='gpu_predictor',
            random_state=42
        )
        
        model.fit(features['X'], features['y'])
        
        # Log feature importance
        importance = model.feature_importances_
        feature_names = features['feature_names']
        
        for name, imp in zip(feature_names, importance):
            logger.info(f"Sentiment feature importance - {name}: {imp:.4f}")
        
        return model
    
    async def _train_technical_model(self, features):
        model = XGBClassifier(
            n_estimators=200,
            max_depth=8,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            gpu_id=0,
            tree_method='gpu_hist',
            predictor='gpu_predictor',
            random_state=42
        )
        
        model.fit(features['X'], features['y'])
        
        return model
    
    async def _train_ensemble_model(self, features):
        model = XGBClassifier(
            n_estimators=150,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.7,
            colsample_bytree=0.7,
            gpu_id=0,
            tree_method='gpu_hist',
            predictor='gpu_predictor',
            random_state=42
        )
        
        model.fit(features['X'], features['y'])
        
        return model
    
    async def _calibrate_model(self, model, features):
        """Apply temperature scaling for probability calibration"""
        # Get validation predictions
        val_preds = model.predict_proba(features['X_val'])[:, 1]
        val_labels = features['y_val']
        
        # Optimize temperature parameter
        def nll_loss(temp):
            scaled_logits = np.log(val_preds / (1 - val_preds)) / temp
            scaled_probs = 1 / (1 + np.exp(-scaled_logits))
            
            # Negative log-likelihood
            epsilon = 1e-10
            nll = -np.mean(
                val_labels * np.log(scaled_probs + epsilon) + 
                (1 - val_labels) * np.log(1 - scaled_probs + epsilon)
            )
            return nll
        
        result = minimize(nll_loss, x0=1.0, bounds=[(0.1, 10.0)])
        optimal_temp = result.x[0]
        
        logger.info(f"Optimal temperature for calibration: {optimal_temp:.4f}")
        
        return {
            'model': model,
            'params': {'temperature': optimal_temp}
        }
```

#### 1.4.2 Model Inference Service
```python
class PredictionService:
    def __init__(self):
        self.model_registry = ModelRegistry()
        self.feature_store = FeatureStore()
        self.models = {}
        self.calibration_params = {}
        
    async def load_models(self):
        """Load latest models from registry"""
        latest_models = await self.model_registry.get_latest_models()
        
        self.models = {
            'sentiment': latest_models['sentiment_model'],
            'technical': latest_models['technical_model'],
            'ensemble': latest_models['ensemble_model']
        }
        
        self.calibration_params = latest_models['calibration_params']
        
        logger.info(f"Loaded models version: {latest_models['version']}")
    
    async def predict(self, token: str, horizon: str):
        # Validate inputs
        if token not in ['BTC', 'ETH', 'SOL', 'ADA']:
            raise ValueError(f"Invalid token: {token}")
        
        if horizon not in ['5m', '1h']:
            raise ValueError(f"Invalid horizon: {horizon}")
        
        # Get latest features
        current_time = int(time.time() * 1000)
        features = await self.feature_store.get_latest_features(token, current_time)
        
        # Check feature freshness
        if not features or (current_time - features['timestamp']) > 120000:  # 2 minutes
            raise StaleDataError("Features are stale")
        
        # Prepare feature vectors
        sentiment_features = self._extract_sentiment_vector(features)
        technical_features = self._extract_technical_vector(features)
        
        # Get base model predictions
        p_sentiment_up = float(self.models['sentiment'].predict_proba(
            sentiment_features.reshape(1, -1)
        )[0, 1])
        
        p_technical_up = float(self.models['technical'].predict_proba(
            technical_features.reshape(1, -1)
        )[0, 1])
        
        # Prepare ensemble features
        ensemble_features = np.concatenate([
            [p_sentiment_up, p_technical_up],
            sentiment_features,
            technical_features
        ]).reshape(1, -1)
        
        # Get ensemble prediction
        p_raw_up = float(self.models['ensemble'].predict_proba(ensemble_features)[0, 1])
        
        # Apply temperature calibration
        temperature = self.calibration_params['temperature']
        logit = np.log(p_raw_up / (1 - p_raw_up))
        p_calibrated_up = 1 / (1 + np.exp(-logit / temperature))
        
        return {
            'token': token,
            'horizon': horizon,
            'prob_up': round(float(p_calibrated_up), 4),
            'prob_down': round(float(1 - p_calibrated_up), 4),
            'timestamp': datetime.fromtimestamp(current_time / 1000).isoformat() + 'Z',
            'model_version': self.models.get('version', 'unknown')
        }
    
    def _extract_sentiment_vector(self, features):
        """Extract sentiment features in correct order"""
        if features['interval'] == '1m':
            return np.array([
                features.get('meanSentiment1m', 0),
                features.get('sentimentMomentum1m', 0),
                features.get('sentimentCount1m', 0)
            ])
        else:  # 5m
            return np.array([
                features.get('meanSentiment5m', 0),
                features.get('sentimentMomentum5m', 0),
                features.get('sentimentCount5m', 0)
            ])
    
    def _extract_technical_vector(self, features):
        """Extract technical features in correct order"""
        interval = '1m' if features['interval'] == '1m' else '5m'
        
        return np.array([
            features.get(f'RSI{interval}', 50),  # Default RSI to neutral
            features.get(f'MACD{interval}', 0),
            features.get(f'MACD_signal{interval}', 0),
            features.get(f'BollingerZ{interval}', 0),
            features.get(f'VWAPDeviation{interval}', 0)
        ])
```

### 1.5 API Layer Design

#### 1.5.1 FastAPI Application
```python
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI(title="CryptoSignalBot API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
prediction_service = PredictionService()
auth_service = AuthService()
metrics_collector = MetricsCollector()

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    await prediction_service.load_models()
    await auth_service.initialize()
    logger.info("API service started successfully")

@app.get("/healthz")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/predict")
async def predict(
    token: str,
    horizon: str,
    api_key: str = Depends(auth_service.validate_api_key)
):
    """Get prediction for specified token and horizon"""
    start_time = time.time()
    
    try:
        # Track API usage
        await metrics_collector.track_request(api_key, token, horizon)
        
        # Get prediction
        result = await prediction_service.predict(token, horizon)
        
        # Record latency
        latency = (time.time() - start_time) * 1000
        await metrics_collector.record_latency('predict', latency)
        
        return JSONResponse(content=result, status_code=200)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    except StaleDataError as e:
        raise HTTPException(
            status_code=503,
            detail="Features stale; retry after 1 minute"
        )
    
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.websocket("/ws/predict")
async def websocket_predict(websocket: WebSocket, api_key: str):
    """WebSocket endpoint for real-time predictions"""
    # Validate API key
    if not await auth_service.validate_ws_key(api_key):
        await websocket.close(code=1008, reason="Invalid API key")
        return
    
    await websocket.accept()
    
    try:
        # Send predictions every 60 seconds
        while True:
            predictions = {}
            
            for token in ['BTC', 'ETH', 'SOL', 'ADA']:
                for horizon in ['5m', '1h']:
                    try:
                        pred = await prediction_service.predict(token, horizon)
                        key = f"{token}_{horizon}"
                        predictions[key] = pred
                    except Exception as e:
                        predictions[key] = {"error": str(e)}
            
            await websocket.send_json({
                "type": "predictions",
                "data": predictions,
                "timestamp": datetime.now().isoformat()
            })
            
            await asyncio.sleep(60)
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for key: {api_key[:8]}...")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close(code=1011, reason="Internal error")

@app.post("/alerts")
async def create_alert(
    alert_config: AlertConfig,
    api_key: str = Depends(auth_service.validate_api_key)
):
    """Create a new alert configuration"""
    try:
        alert_id = await alert_service.create_alert(api_key, alert_config)
        return {"alert_id": alert_id, "status": "created"}
    
    except Exception as e:
        logger.error(f"Alert creation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create alert")

@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint"""
    return Response(
        content=generate_latest(),
        media_type="text/plain"
    )
```

#### 1.5.2 Authentication Service
```python
class AuthService:
    def __init__(self):
        self.db = PostgresDB()
        self.redis = redis.Redis(host='redis', port=6379)
        self.rate_limiter = {}
    
    async def initialize(self):
        """Initialize authentication service"""
        await self.db.connect()
    
    async def validate_api_key(self, authorization: str = Header(None)):
        """Validate API key from Authorization header"""
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=401,
                detail="Invalid API key format"
            )
        
        api_key = authorization.replace("Bearer ", "")
        
        # Check cache first
        cached = self.redis.get(f"api_key:{api_key}")
        if cached:
            return api_key
        
        # Validate against database
        query = """
            SELECT user_id, is_active, rate_limit
            FROM api_keys
            WHERE key = $1 AND is_active = true
        """
        
        result = await self.db.fetch_one(query, api_key)
        
        if not result:
            raise HTTPException(
                status_code=401,
                detail="Invalid API key"
            )
        
        # Check rate limit
        if not await self._check_rate_limit(api_key, result['rate_limit']):
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded"
            )
        
        # Cache valid key
        self.redis.setex(f"api_key:{api_key}", 300, "1")
        
        return api_key
    
    async def _check_rate_limit(self, api_key: str, limit: int):
        """Check if API key has exceeded rate limit"""
        key = f"rate_limit:{api_key}"
        current = self.redis.incr(key)
        
        if current == 1:
            self.redis.expire(key, 60)  # 1 minute window
        
        return current <= limit
```

### 1.6 Dashboard Design

#### 1.6.1 React Dashboard Component Structure
```typescript
// Main App Component
interface AppState {
    apiKey: string | null;
    isAuthenticated: boolean;
    predictions: PredictionData;
    historicalData: HistoricalData;
    alerts: Alert[];
    wsConnection: WebSocket | null;
}

class CryptoSignalDashboard extends React.Component<{}, AppState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            apiKey: localStorage.getItem('apiKey'),
            isAuthenticated: false,
            predictions: {},
            historicalData: {},
            alerts: [],
            wsConnection: null
        };
    }
    
    componentDidMount() {
        if (this.state.apiKey) {
            this.authenticate();
        }
    }
    
    async authenticate() {
        try {
            // Validate API key
            const response = await fetch('/api/predict?token=BTC&horizon=5m', {
                headers: {
                    'Authorization': `Bearer ${this.state.apiKey}`
                }
            });
            
            if (response.ok) {
                this.setState({ isAuthenticated: true });
                this.connectWebSocket();
                this.loadAlerts();
            } else {
                this.setState({ apiKey: null, isAuthenticated: false });
                localStorage.removeItem('apiKey');
            }
        } catch (error) {
            console.error('Authentication failed:', error);
        }
    }
    
    connectWebSocket() {
        const ws = new WebSocket(`wss://api.cryptosignalbot.com/ws/predict?apikey=${this.state.apiKey}`);
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'predictions') {
                this.updatePredictions(data.data);
            }
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            // Fallback to polling
            this.startPolling();
        };
        
        ws.onclose = () => {
            // Attempt reconnection after 10 seconds
            setTimeout(() => this.connectWebSocket(), 10000);
        };
        
        this.setState({ wsConnection: ws });
    }
    
    render() {
        if (!this.state.isAuthenticated) {
            return <LoginScreen onAuthenticate={this.authenticate.bind(this)} />;
        }
        
        return (
            <div className="dashboard">
                <Header />
                <div className="dashboard-grid">
                    <ProbabilityGauges predictions={this.state.predictions} />
                    <TimeSeriesCharts data={this.state.historicalData} />
                    <AlertsPanel 
                        alerts={this.state.alerts}
                        onCreateAlert={this.createAlert.bind(this)}
                    />
                </div>
            </div>
        );
    }
}

// Probability Gauge Component
interface GaugeProps {
    token: string;
    horizon: string;
    probability: number;
    timestamp: string;
}

const ProbabilityGauge: React.FC<GaugeProps> = ({ token, horizon, probability, timestamp }) => {
    const isUp = probability >= 0.5;
    const percentage = Math.round(probability * 100);
    
    return (
        <div className={`gauge ${isUp ? 'gauge-up' : 'gauge-down'}`}>
            <h3>{token} - {horizon}</h3>
            <svg viewBox="0 0 200 100" className="gauge-svg">
                <path
                    d="M 10 90 A 80 80 0 0 1 190 90"
                    fill="none"
                    stroke="#e0e0e0"
                    strokeWidth="20"
                />
                <path
                    d="M 10 90 A 80 80 0 0 1 190 90"
                    fill="none"
                    stroke={isUp ? '#4caf50' : '#f44336'}
                    strokeWidth="20"
                    strokeDasharray={`${percentage * 1.57} 157`}
                    className="gauge-fill"
                />
            </svg>
            <div className="gauge-value">{percentage}%</div>
            <div className="gauge-label">{isUp ? 'UP' : 'DOWN'}</div>
            <div className="gauge-time">{new Date(timestamp).toLocaleTimeString()}</div>
        </div>
    );
};

// Time Series Chart Component
interface ChartProps {
    data: TimeSeriesData;
    indicator: string;
}

const TimeSeriesChart: React.FC<ChartProps> = ({ data, indicator }) => {
    const chartRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (!chartRef.current || !data) return;
        
        const margin = { top: 20, right: 30, bottom: 40, left: 50 };
        const width = chartRef.current.clientWidth - margin.left - margin.right;
        const height = 200 - margin.top - margin.bottom;
        
        // Clear previous chart
        d3.select(chartRef.current).selectAll("*").remove();
        
        const svg = d3.select(chartRef.current)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);
        
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        // Scales
        const xScale = d3.scaleTime()
            .domain(d3.extent(data, d => d.timestamp))
            .range([0, width]);
        
        const yScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d[indicator]))
            .range([height, 0]);
        
        // Line generator
        const line = d3.line<any>()
            .x(d => xScale(d.timestamp))
            .y(d => yScale(d[indicator]))
            .curve(d3.curveMonotoneX);
        
        // Add axes
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).ticks(5));
        
        g.append("g")
            .call(d3.axisLeft(yScale).ticks(5));
        
        // Add line
        g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "#2196f3")
            .attr("stroke-width", 2)
            .attr("d", line);
        
        // Add dots
        g.selectAll(".dot")
            .data(data)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("cx", d => xScale(d.timestamp))
            .attr("cy", d => yScale(d[indicator]))
            .attr("r", 3)
            .attr("fill", "#2196f3");
        
    }, [data, indicator]);
    
    return (
        <div className="chart-container">
            <h4>{indicator}</h4>
            <div ref={chartRef} className="chart"></div>
        </div>
    );
};
```

### 1.7 Alert Service Design

```python
class AlertService:
    def __init__(self):
        self.db = PostgresDB()
        self.email_client = AWSEmailClient()
        self.sms_client = TwilioSMSClient()
        self.prediction_service = PredictionService()
        
    async def process_alerts(self):
        """Main alert processing loop"""
        while True:
            try:
                active_alerts = await self.get_active_alerts()
                
                for alert in active_alerts:
                    await self.check_alert_condition(alert)
                
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                logger.error(f"Alert processing error: {e}")
                await asyncio.sleep(60)
    
    async def check_alert_condition(self, alert):
        """Check if alert condition is met"""
        try:
            # Get current prediction
            prediction = await self.prediction_service.predict(
                alert['token'],
                alert['horizon']
            )
            
            prob_up = prediction['prob_up']
            
            # Check threshold
            if prob_up >= alert['threshold']:
                # Check if already notified recently
                if not await self.was_recently_notified(alert['id']):
                    await self.send_notification(alert, prob_up)
                    await self.mark_as_notified(alert['id'])
                    
        except Exception as e:
            logger.error(f"Error checking alert {alert['id']}: {e}")
    
    async def send_notification(self, alert, probability):
        """Send alert notification"""
        message = self._format_message(alert, probability)
        
        if alert['notification_method'] == 'email':
            await self.email_client.send(
                to=alert['contact'],
                subject=f"Crypto Signal Alert: {alert['token']}",
                body=message
            )
        elif alert['notification_method'] == 'sms':
            await self.sms_client.send(
                to=alert['contact'],
                body=message
            )
    
    def _format_message(self, alert, probability):
        """Format alert message"""
        return f"""
        CryptoSignalBot Alert
        
        Token: {alert['token']}
        Horizon: {alert['horizon']}
        Probability (UP): {probability:.2%}
        Threshold: {alert['threshold']:.2%}
        
        Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}
        
        This alert was triggered because the probability exceeded your configured threshold.
        """
```

### 1.8 Backtesting Engine Design

```python
class BacktestEngine:
    def __init__(self):
        self.timeseries_db = TimeSeriesDB()
        self.feature_store = FeatureStore()
        self.model_registry = ModelRegistry()
        self.report_generator = ReportGenerator()
        
    async def run_backtest(self, config: BacktestConfig):
        """Run historical backtest simulation"""
        logger.info(f"Starting backtest for {config.token} from {config.start_date} to {config.end_date}")
        
        # Load historical data
        ohlcv_data = await self._load_historical_data(config)
        
        # Load or compute features
        features = await self._prepare_features(config, ohlcv_data)
        
        # Load models
        models = await self._load_backtest_models(config.model_version)
        
        # Initialize portfolio
        portfolio = Portfolio(
            initial_capital=config.initial_capital,
            position_size=config.position_size,
            fees=config.fees,
            slippage=config.slippage
        )
        
        # Simulation loop
        trades = []
        equity_curve = []
        
        for i in range(len(features) - 1):
            current_time = features[i]['timestamp']
            current_price = ohlcv_data[i]['close']
            
            # Get prediction
            prediction = await self._get_offline_prediction(
                features[i], models, config.horizon
            )
            
            # Trading logic
            signal = self._generate_signal(
                prediction,
                config.threshold_up,
                config.threshold_down
            )
            
            if signal != 'HOLD':
                trade = await self._execute_trade(
                    signal,
                    current_time,
                    current_price,
                    portfolio,
                    config
                )
                
                if trade:
                    trades.append(trade)
            
            # Update equity
            equity_curve.append({
                'timestamp': current_time,
                'equity': portfolio.get_equity(current_price),
                'positions': portfolio.get_position_value(current_price)
            })
        
        # Calculate metrics
        metrics = self._calculate_performance_metrics(
            trades,
            equity_curve,
            ohlcv_data
        )
        
        # Generate report
        report = await self.report_generator.generate(
            config,
            trades,
            equity_curve,
            metrics
        )
        
        return report
    
    def _calculate_performance_metrics(self, trades, equity_curve, market_data):
        """Calculate comprehensive performance metrics"""
        if not trades:
            return {
                'total_trades': 0,
                'win_rate': 0,
                'sharpe_ratio': 0,
                'max_drawdown': 0,
                'total_pnl': 0
            }
        
        # Win rate
        profitable_trades = [t for t in trades if t['pnl'] > 0]
        win_rate = len(profitable_trades) / len(trades)
        
        # P&L metrics
        total_pnl = sum(t['pnl'] for t in trades)
        avg_win = np.mean([t['pnl'] for t in profitable_trades]) if profitable_trades else 0
        avg_loss = np.mean([t['pnl'] for t in trades if t['pnl'] <= 0]) if len(trades) > len(profitable_trades) else 0
        
        # Sharpe ratio
        returns = pd.Series([e['equity'] for e in equity_curve]).pct_change().dropna()
        sharpe_ratio = np.sqrt(252) * returns.mean() / returns.std() if returns.std() > 0 else 0
        
        # Maximum drawdown
        equity_series = pd.Series([e['equity'] for e in equity_curve])
        rolling_max = equity_series.expanding().max()
        drawdown = (equity_series - rolling_max) / rolling_max
        max_drawdown = drawdown.min()
        
        # Market comparison
        market_return = (market_data[-1]['close'] - market_data[0]['close']) / market_data[0]['close']
        strategy_return = (equity_curve[-1]['equity'] - equity_curve[0]['equity']) / equity_curve[0]['equity']
        
        return {
            'total_trades': len(trades),
            'profitable_trades': len(profitable_trades),
            'win_rate': win_rate,
            'total_pnl': total_pnl,
            'avg_win': avg_win,
            'avg_loss': avg_loss,
            'profit_factor': abs(avg_win / avg_loss) if avg_loss != 0 else 0,
            'sharpe_ratio': sharpe_ratio,
            'max_drawdown': max_drawdown,
            'strategy_return': strategy_return,
            'market_return': market_return,
            'alpha': strategy_return - market_return
        }
```

## 2. Database Schema Design

### 2.1 PostgreSQL Schema

```sql
-- User management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- API key management
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    rate_limit INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP
);

CREATE INDEX idx_api_keys_key ON api_keys(key);
CREATE INDEX idx_api_keys_user ON api_keys(user_id);

-- Alert configurations
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(10) NOT NULL CHECK (token IN ('BTC', 'ETH', 'SOL', 'ADA')),
    horizon VARCHAR(5) NOT NULL CHECK (horizon IN ('5m', '1h')),
    threshold DECIMAL(3,2) CHECK (threshold >= 0.50 AND threshold <= 1.00),
    notification_method VARCHAR(20) CHECK (notification_method IN ('email', 'sms')),
    contact VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_triggered TIMESTAMP
);

CREATE INDEX idx_alerts_active ON alerts(is_active) WHERE is_active = true;
CREATE INDEX idx_alerts_user ON alerts(user_id);

-- Alert history
CREATE TABLE alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    probability DECIMAL(4,4),
    notification_sent BOOLEAN DEFAULT false,
    error_message TEXT
);

CREATE INDEX idx_alert_history_alert ON alert_history(alert_id);
CREATE INDEX idx_alert_history_time ON alert_history(triggered_at);

-- Model registry
CREATE TABLE models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version VARCHAR(50) UNIQUE NOT NULL,
    sentiment_model_path VARCHAR(255),
    technical_model_path VARCHAR(255),
    ensemble_model_path VARCHAR(255),
    calibration_params JSONB,
    training_date TIMESTAMP,
    validation_metrics JSONB,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_models_active ON models(is_active) WHERE is_active = true;
CREATE INDEX idx_models_version ON models(version);

-- API usage tracking
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    endpoint VARCHAR(100),
    token VARCHAR(10),
    horizon VARCHAR(5),
    response_time_ms INTEGER,
    status_code INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_usage_key ON api_usage(api_key_id);
CREATE INDEX idx_api_usage_time ON api_usage(created_at);

-- Backtesting results
CREATE TABLE backtest_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    config JSONB NOT NULL,
    metrics JSONB NOT NULL,
    report_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_backtest_user ON backtest_results(user_id);
```

### 2.2 Time-Series Database Schema (InfluxDB)

```javascript
// InfluxDB schema definitions

// OHLCV data
// Measurement: ohlcv
// Tags: token, interval
// Fields: open, high, low, close, volume
// Time: millisecond precision

// Example point:
{
  measurement: "ohlcv",
  tags: {
    token: "BTC",
    interval: "1m"
  },
  fields: {
    open: 45123.50,
    high: 45234.00,
    low: 45100.00,
    close: 45189.25,
    volume: 123.456
  },
  timestamp: 1654300800000
}

// Sentiment scores
// Measurement: sentiment
// Tags: token, source
// Fields: score, count
// Time: millisecond precision

// Technical indicators
// Measurement: indicators
// Tags: token, interval
// Fields: RSI, MACD, MACD_signal, BollingerZ, VWAPDeviation
// Time: millisecond precision

// Aggregated features
// Measurement: features
// Tags: token, interval
// Fields: meanSentiment, sentimentMomentum, all technical indicators
// Time: millisecond precision
```

## 3. Infrastructure Configuration

### 3.1 Docker Compose Configuration

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: cryptosignalbot
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # InfluxDB Time-Series Database
  influxdb:
    image: influxdb:2.7-alpine
    environment:
      DOCKER_INFLUXDB_INIT_MODE: setup
      DOCKER_INFLUXDB_INIT_USERNAME: ${INFLUXDB_USER}
      DOCKER_INFLUXDB_INIT_PASSWORD: ${INFLUXDB_PASSWORD}
      DOCKER_INFLUXDB_INIT_ORG: crypto_trading
      DOCKER_INFLUXDB_INIT_BUCKET: market_data
      DOCKER_INFLUXDB_INIT_RETENTION: 365d
      DOCKER_INFLUXDB_INIT_ADMIN_TOKEN: ${INFLUXDB_TOKEN}
    volumes:
      - influxdb_data:/var/lib/influxdb2
      - influxdb_config:/etc/influxdb2
    ports:
      - "8086:8086"

  # Redis Cache
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  # Kafka Message Queue
  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    depends_on:
      - zookeeper
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
    ports:
      - "9092:9092"

  # Market Data Ingestion Service
  market-ingestion:
    build:
      context: ./services/market-ingestion
      dockerfile: Dockerfile
    environment:
      INFLUXDB_URL: http://influxdb:8086
      INFLUXDB_TOKEN: ${INFLUXDB_TOKEN}
      KAFKA_BOOTSTRAP_SERVERS: kafka:9092
    depends_on:
      - influxdb
      - kafka
    restart: unless-stopped

  # Text Ingestion Service
  text-ingestion:
    build:
      context: ./services/text-ingestion
      dockerfile: Dockerfile
    environment:
      CRYPTOCONTROL_API_KEY: ${CRYPTOCONTROL_API_KEY}
      TWITTER_BEARER_TOKEN: ${TWITTER_BEARER_TOKEN}
      REDDIT_CLIENT_ID: ${REDDIT_CLIENT_ID}
      REDDIT_CLIENT_SECRET: ${REDDIT_CLIENT_SECRET}
      KAFKA_BOOTSTRAP_SERVERS: kafka:9092
    depends_on:
      - kafka
    restart: unless-stopped

  # Feature Engineering Service (GPU)
  feature-engineering:
    build:
      context: ./services/feature-engineering
      dockerfile: Dockerfile.gpu
    runtime: nvidia
    environment:
      NVIDIA_VISIBLE_DEVICES: all
      KAFKA_BOOTSTRAP_SERVERS: kafka:9092
      INFLUXDB_URL: http://influxdb:8086
      INFLUXDB_TOKEN: ${INFLUXDB_TOKEN}
      REDIS_HOST: redis
    depends_on:
      - kafka
      - influxdb
      - redis
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  # Prediction API Service
  prediction-api:
    build:
      context: ./services/prediction-api
      dockerfile: Dockerfile
    runtime: nvidia
    environment:
      NVIDIA_VISIBLE_DEVICES: all
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/cryptosignalbot
      INFLUXDB_URL: http://influxdb:8086
      INFLUXDB_TOKEN: ${INFLUXDB_TOKEN}
      REDIS_HOST: redis
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - influxdb
      - redis
    deploy:
      replicas: 2
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  # Alert Service
  alert-service:
    build:
      context: ./services/alert-service
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/cryptosignalbot
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      AWS_REGION: ${AWS_REGION}
      TWILIO_ACCOUNT_SID: ${TWILIO_ACCOUNT_SID}
      TWILIO_AUTH_TOKEN: ${TWILIO_AUTH_TOKEN}
      TWILIO_FROM_NUMBER: ${TWILIO_FROM_NUMBER}
    depends_on:
      - postgres
      - prediction-api

  # React Dashboard
  dashboard:
    build:
      context: ./dashboard
      dockerfile: Dockerfile
      args:
        REACT_APP_API_URL: ${API_URL}
        REACT_APP_WS_URL: ${WS_URL}
    ports:
      - "3000:80"
    depends_on:
      - prediction-api

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - prediction-api
      - dashboard

  # Prometheus Monitoring
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  # Grafana Dashboards
  grafana:
    image: grafana/grafana:latest
    environment:
      GF_SECURITY_ADMIN_USER: ${GRAFANA_USER}
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    ports:
      - "3001:3000"
    depends_on:
      - prometheus

volumes:
  postgres_data:
  influxdb_data:
  influxdb_config:
  redis_data:
  prometheus_data:
  grafana_data:
```

### 3.2 Kubernetes Deployment Configuration

```yaml
# GPU Node Pool Configuration
apiVersion: v1
kind: ResourceQuota
metadata:
  name: gpu-quota
  namespace: crypto-signal-bot
spec:
  hard:
    requests.nvidia.com/gpu: "4"
    
---
# Feature Engineering Deployment (GPU)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: feature-engineering
  namespace: crypto-signal-bot
spec:
  replicas: 2
  selector:
    matchLabels:
      app: feature-engineering
  template:
    metadata:
      labels:
        app: feature-engineering
    spec:
      containers:
      - name: feature-engineering
        image: cryptosignalbot/feature-engineering:latest
        resources:
          requests:
            memory: "8Gi"
            cpu: "2"
            nvidia.com/gpu: 1
          limits:
            memory: "16Gi"
            cpu: "4"
            nvidia.com/gpu: 1
        env:
        - name: KAFKA_BOOTSTRAP_SERVERS
          value: "kafka-service:9092"
        - name: INFLUXDB_URL
          value: "http://influxdb-service:8086"
        - name: INFLUXDB_TOKEN
          valueFrom:
            secretKeyRef:
              name: influxdb-secret
              key: token
              
---
# Prediction API Service (GPU with HPA)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prediction-api
  namespace: crypto-signal-bot
spec:
  replicas: 3
  selector:
    matchLabels:
      app: prediction-api
  template:
    metadata:
      labels:
        app: prediction-api
    spec:
      containers:
      - name: prediction-api
        image: cryptosignalbot/prediction-api:latest
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "4Gi"
            cpu: "2"
            nvidia.com/gpu: 1
          limits:
            memory: "8Gi"
            cpu: "4"
            nvidia.com/gpu: 1
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: url
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /healthz
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
          
---
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: prediction-api-hpa
  namespace: crypto-signal-bot
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: prediction-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: nvidia.com/gpu
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "100"
```

## 4. Security Implementation

### 4.1 API Security Middleware

```python
from cryptography.fernet import Fernet
import jwt
from datetime import datetime, timedelta

class SecurityMiddleware:
    def __init__(self):
        self.encryption_key = Fernet.generate_key()
        self.cipher = Fernet(self.encryption_key)
        self.jwt_secret = os.environ.get("JWT_SECRET")
        
    async def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data before storage"""
        return self.cipher.encrypt(data.encode()).decode()
    
    async def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        return self.cipher.decrypt(encrypted_data.encode()).decode()
    
    def generate_api_key(self, user_id: str) -> str:
        """Generate secure API key"""
        payload = {
            'user_id': user_id,
            'created_at': datetime.utcnow().isoformat(),
            'nonce': secrets.token_urlsafe(16)
        }
        
        return jwt.encode(payload, self.jwt_secret, algorithm='HS256')
    
    async def validate_request_signature(self, request: Request):
        """Validate request signature for webhook endpoints"""
        signature = request.headers.get('X-Signature')
        timestamp = request.headers.get('X-Timestamp')
        
        if not signature or not timestamp:
            raise HTTPException(status_code=401, detail="Missing signature")
        
        # Check timestamp to prevent replay attacks
        request_time = datetime.fromtimestamp(int(timestamp))
        if (datetime.utcnow() - request_time).seconds > 300:  # 5 minutes
            raise HTTPException(status_code=401, detail="Request expired")
        
        # Verify signature
        body = await request.body()
        expected_signature = hmac.new(
            self.webhook_secret.encode(),
            f"{timestamp}{body.decode()}".encode(),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected_signature):
            raise HTTPException(status_code=401, detail="Invalid signature")
```

### 4.2 Rate Limiting Implementation

```python
class RateLimiter:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.limits = {
            'default': {'requests': 100, 'window': 60},
            'premium': {'requests': 1000, 'window': 60},
            'enterprise': {'requests': 10000, 'window': 60}
        }
    
    async def check_rate_limit(self, api_key: str, tier: str = 'default'):
        """Check if request is within rate limit"""
        key = f"rate_limit:{api_key}"
        limit_config = self.limits.get(tier, self.limits['default'])
        
        try:
            current = self.redis.incr(key)
            
            if current == 1:
                self.redis.expire(key, limit_config['window'])
            
            if current > limit_config['requests']:
                ttl = self.redis.ttl(key)
                raise RateLimitExceeded(
                    f"Rate limit exceeded. Try again in {ttl} seconds"
                )
            
            return {
                'limit': limit_config['requests'],
                'remaining': limit_config['requests'] - current,
                'reset': time.time() + self.redis.ttl(key)
            }
            
        except redis.RedisError as e:
            logger.error(f"Redis error in rate limiting: {e}")
            # Fail open in case of Redis issues
            return {
                'limit': limit_config['requests'],
                'remaining': limit_config['requests'],
                'reset': time.time() + limit_config['window']
            }
```

## 5. Performance Optimization Strategies

### 5.1 GPU Memory Management

```python
class GPUMemoryManager:
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.memory_limit = 0.8  # Use max 80% of GPU memory
        
    def optimize_batch_size(self, model, sample_input):
        """Dynamically determine optimal batch size"""
        if not torch.cuda.is_available():
            return 32  # Default CPU batch size
        
        # Get available memory
        total_memory = torch.cuda.get_device_properties(0).total_memory
        allocated_memory = torch.cuda.memory_allocated(0)
        available_memory = total_memory - allocated_memory
        
        # Test increasing batch sizes
        batch_size = 1
        model.eval()
        
        with torch.no_grad():
            while batch_size <= 256:
                try:
                    # Clear cache
                    torch.cuda.empty_cache()
                    
                    # Test batch
                    test_input = sample_input.repeat(batch_size, 1)
                    _ = model(test_input)
                    
                    # Check memory usage
                    current_allocated = torch.cuda.memory_allocated(0)
                    if current_allocated > total_memory * self.memory_limit:
                        break
                    
                    batch_size *= 2
                    
                except RuntimeError as e:
                    if "out of memory" in str(e):
                        batch_size //= 2
                        break
                    raise
        
        # Use 75% of max successful batch size for safety
        optimal_batch_size = int(batch_size * 0.75)
        logger.info(f"Optimal batch size: {optimal_batch_size}")
        
        return optimal_batch_size
```

### 5.2 Caching Strategy

```python
class FeatureCache:
    def __init__(self):
        self.redis = redis.Redis(host='redis', port=6379)
        self.local_cache = TTLCache(maxsize=1000, ttl=60)  # 1-minute local cache
        
    async def get_features(self, token: str, timestamp: int):
        """Get features with multi-level caching"""
        cache_key = f"features:{token}:{timestamp}"
        
        # Check local cache first
        if cache_key in self.local_cache:
            return self.local_cache[cache_key]
        
        # Check Redis cache
        cached = self.redis.get(cache_key)
        if cached:
            features = json.loads(cached)
            self.local_cache[cache_key] = features
            return features
        
        # Fetch from database
        features = await self._fetch_from_db(token, timestamp)
        
        # Cache in Redis with 5-minute TTL
        self.redis.setex(
            cache_key,
            300,
            json.dumps(features)
        )
        
        # Cache locally
        self.local_cache[cache_key] = features
        
        return features
```

## 6. Error Handling and Recovery

### 6.1 Circuit Breaker Pattern

```python
class CircuitBreaker:
    def __init__(self, failure_threshold=5, recovery_timeout=60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = 'CLOSED'  # CLOSED, OPEN, HALF_OPEN
        
    async def call(self, func, *args, **kwargs):
        """Execute function with circuit breaker protection"""
        if self.state == 'OPEN':
            if self._should_attempt_reset():
                self.state = 'HALF_OPEN'
            else:
                raise CircuitOpenError("Circuit breaker is OPEN")
        
        try:
            result = await func(*args, **kwargs)
            self._on_success()
            return result
            
        except Exception as e:
            self._on_failure()
            raise
    
    def _should_attempt_reset(self):
        return (
            self.last_failure_time and
            time.time() - self.last_failure_time >= self.recovery_timeout
        )
    
    def _on_success(self):
        self.failure_count = 0
        self.state = 'CLOSED'
    
    def _on_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.failure_threshold:
            self.state = 'OPEN'
            logger.error(f"Circuit breaker opened after {self.failure_count} failures")
```

### 6.2 Graceful Degradation

```python
class GracefulDegradation:
    def __init__(self):
        self.fallback_predictions = {
            'BTC': {'5m': 0.5, '1h': 0.5},
            'ETH': {'5m': 0.5, '1h': 0.5},
            'SOL': {'5m': 0.5, '1h': 0.5},
            'ADA': {'5m': 0.5, '1h': 0.5}
        }
        
    async def get_prediction_with_fallback(self, token: str, horizon: str):
        """Get prediction with fallback options"""
        try:
            # Try primary prediction service
            return await self.prediction_service.predict(token, horizon)
            
        except StaleDataError:
            # Try with relaxed freshness requirement
            try:
                return await self.prediction_service.predict(
                    token, horizon, max_staleness=300  # 5 minutes
                )
            except:
                pass
        
        except ModelLoadError:
            # Try backup model
            try:
                return await self.backup_prediction_service.predict(token, horizon)
            except:
                pass
        
        # Return neutral prediction as last resort
        logger.warning(f"Using fallback prediction for {token} {horizon}")
        
        return {
            'token': token,
            'horizon': horizon,
            'prob_up': self.fallback_predictions[token][horizon],
            'prob_down': 1 - self.fallback_predictions[token][horizon],
            'timestamp': datetime.now().isoformat() + 'Z',
            'warning': 'Using fallback prediction due to service issues'
        }
```

## 7. Monitoring and Observability

### 7.1 Custom Metrics

```python
from prometheus_client import Counter, Histogram, Gauge, Summary

# Define metrics
prediction_requests = Counter(
    'prediction_requests_total',
    'Total prediction requests',
    ['token', 'horizon', 'status']
)

prediction_latency = Histogram(
    'prediction_latency_seconds',
    'Prediction request latency',
    ['token', 'horizon'],
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0]
)

active_websocket_connections = Gauge(
    'active_websocket_connections',
    'Number of active WebSocket connections'
)

feature_staleness = Histogram(
    'feature_staleness_seconds',
    'Age of features when prediction is made',
    ['token'],
    buckets=[1, 5, 10, 30, 60, 120, 300]
)

model_inference_time = Summary(
    'model_inference_duration_seconds',
    'Time spent in model inference',
    ['model_type']
)

gpu_utilization = Gauge(
    'gpu_utilization_percent',
    'GPU utilization percentage',
    ['gpu_id']
)

class MetricsCollector:
    async def track_prediction(self, token, horizon, latency, status):
        """Track prediction metrics"""
        prediction_requests.labels(
            token=token,
            horizon=horizon,
            status=status
        ).inc()
        
        if status == 'success':
            prediction_latency.labels(
                token=token,
                horizon=horizon
            ).observe(latency)
    
    @model_inference_time.labels(model_type='sentiment').time()
    async def time_sentiment_inference(self):
        """Time sentiment model inference"""
        pass
    
    async def update_gpu_metrics(self):
        """Update GPU utilization metrics"""
        if torch.cuda.is_available():
            for i in range(torch.cuda.device_count()):
                utilization = torch.cuda.utilization(i)
                gpu_utilization.labels(gpu_id=str(i)).set(utilization)
```

### 7.2 Distributed Tracing

```python
from opentelemetry import trace
from opentelemetry.exporter.jaeger import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

class DistributedTracing:
    def __init__(self):
        # Configure tracer
        trace.set_tracer_provider(TracerProvider())
        tracer_provider = trace.get_tracer_provider()
        
        # Configure Jaeger exporter
        jaeger_exporter = JaegerExporter(
            agent_host_name="jaeger",
            agent_port=6831,
        )
        
        # Add span processor
        span_processor = BatchSpanProcessor(jaeger_exporter)
        tracer_provider.add_span_processor(span_processor)
        
        self.tracer = trace.get_tracer(__name__)
    
    def trace_prediction(self, token, horizon):
        """Create trace span for prediction request"""
        with self.tracer.start_as_current_span(
            "prediction_request",
            attributes={
                "token": token,
                "horizon": horizon,
                "service": "prediction-api"
            }
        ) as span:
            return span
    
    def trace_feature_computation(self, token, feature_type):
        """Create trace span for feature computation"""
        with self.tracer.start_as_current_span(
            "feature_computation",
            attributes={
                "token": token,
                "feature_type": feature_type
            }
        ) as span:
            return span
```

## 8. Testing Strategy

### 8.1 Unit Test Examples

```python
import pytest
from unittest.mock import Mock, patch
import numpy as np

class TestSentimentAnalyzer:
    @pytest.fixture
    def analyzer(self):
        return SentimentAnalyzer()
    
    def test_sentiment_score_range(self, analyzer):
        """Test sentiment scores are in valid range"""
        texts = [
            "Bitcoin is going to the moon!",
            "Crypto market crash incoming",
            "Ethereum shows steady growth"
        ]
        
        scores = analyzer.score_texts(texts)
        
        assert all(-1.0 <= score <= 1.0 for score in scores)
    
    @patch('torch.cuda.is_available')
    def test_gpu_fallback(self, mock_cuda, analyzer):
        """Test fallback to CPU when GPU unavailable"""
        mock_cuda.return_value = False
        
        text = "Test sentiment"
        score = analyzer.score_text(text)
        
        assert isinstance(score, float)
        assert analyzer.device.type == 'cpu'

class TestPredictionService:
    @pytest.fixture
    def prediction_service(self):
        service = PredictionService()
        service.models = {
            'sentiment': Mock(),
            'technical': Mock(),
            'ensemble': Mock()
        }
        service.calibration_params = {'temperature': 1.5}
        return service
    
    @pytest.mark.asyncio
    async def test_stale_data_handling(self, prediction_service):
        """Test handling of stale feature data"""
        with patch.object(prediction_service.feature_store, 'get_latest_features') as mock_get:
            # Return stale features (3 minutes old)
            mock_get.return_value = {
                'timestamp': int(time.time() * 1000) - 180000
            }
            
            with pytest.raises(StaleDataError):
                await prediction_service.predict('BTC', '5m')
    
    def test_probability_calibration(self, prediction_service):
        """Test temperature calibration of probabilities"""
        raw_prob = 0.8
        temperature = 1.5
        
        # Manual calculation
        logit = np.log(raw_prob / (1 - raw_prob))
        expected = 1 / (1 + np.exp(-logit / temperature))
        
        # Test calibration
        calibrated = prediction_service._apply_calibration(raw_prob, temperature)
        
        assert abs(calibrated - expected) < 0.0001
```

### 8.2 Integration Test Examples

```python
class TestEndToEndPipeline:
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_prediction_pipeline(self, test_client):
        """Test complete prediction pipeline"""
        # Setup test data
        await self._setup_test_market_data()
        await self._setup_test_sentiment_data()
        
        # Make prediction request
        response = await test_client.get(
            "/predict?token=BTC&horizon=5m",
            headers={"Authorization": "Bearer test_key"}
        )
        
        assert response.status_code == 200
        
        data = response.json()
        assert data['token'] == 'BTC'
        assert data['horizon'] == '5m'
        assert 0 <= data['prob_up'] <= 1
        assert abs(data['prob_up'] + data['prob_down'] - 1.0) < 0.0001
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_alert_triggering(self, test_client):
        """Test alert triggering and notification"""
        # Create alert
        alert_config = {
            "token": "ETH",
            "horizon": "1h",
            "threshold": 0.7,
            "notification_method": "email",
            "contact": "test@example.com"
        }
        
        response = await test_client.post(
            "/alerts",
            json=alert_config,
            headers={"Authorization": "Bearer test_key"}
        )
        
        assert response.status_code == 200
        alert_id = response.json()['alert_id']
        
        # Mock high probability prediction
        with patch.object(PredictionService, 'predict') as mock_predict:
            mock_predict.return_value = {
                'prob_up': 0.75,
                'prob_down': 0.25
            }
            
            # Trigger alert processing
            await alert_service.process_alerts()
            
            # Verify notification sent
            assert mock_email_client.send.called
```

### 8.3 Load Test Configuration

```python
# locustfile.py
from locust import HttpUser, task, between

class CryptoSignalBotUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Get API key on start"""
        self.api_key = "load_test_key"
        self.headers = {"Authorization": f"Bearer {self.api_key}"}
    
    @task(weight=8)
    def get_prediction(self):
        """Most common operation - get prediction"""
        tokens = ['BTC', 'ETH', 'SOL', 'ADA']
        horizons = ['5m', '1h']
        
        token = random.choice(tokens)
        horizon = random.choice(horizons)
        
        self.client.get(
            f"/predict?token={token}&horizon={horizon}",
            headers=self.headers,
            name="/predict"
        )
    
    @task(weight=1)
    def create_alert(self):
        """Less common - create alert"""
        alert_config = {
            "token": random.choice(['BTC', 'ETH', 'SOL', 'ADA']),
            "horizon": random.choice(['5m', '1h']),
            "threshold": round(random.uniform(0.6, 0.9), 2),
            "notification_method": "email",
            "contact": f"user{random.randint(1,1000)}@test.com"
        }
        
        self.client.post(
            "/alerts",
            json=alert_config,
            headers=self.headers,
            name="/alerts"
        )
    
    @task(weight=1)
    def websocket_connection(self):
        """WebSocket connection test"""
        ws_url = f"wss://api.cryptosignalbot.com/ws/predict?apikey={self.api_key}"
        
        with self.client.websocket(ws_url) as ws:
            # Wait for predictions
            for i in range(5):
                message = ws.receive()
                assert message is not None
                time.sleep(1)
```

## 9. Deployment Scripts

### 9.1 Kubernetes Deployment Script

```bash
#!/bin/bash
# deploy.sh - Deploy CryptoSignalBot to Kubernetes

set -e

# Configuration
NAMESPACE="crypto-signal-bot"
REGISTRY="gcr.io/project-id"
VERSION=${1:-latest}

echo "Deploying CryptoSignalBot version: $VERSION"

# Create namespace if not exists
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Deploy secrets
kubectl create secret generic postgres-secret \
  --from-literal=url="$DATABASE_URL" \
  --namespace=$NAMESPACE \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic api-keys \
  --from-literal=jwt-secret="$JWT_SECRET" \
  --from-literal=cryptocontrol-key="$CRYPTOCONTROL_API_KEY" \
  --from-literal=twitter-token="$TWITTER_BEARER_TOKEN" \
  --namespace=$NAMESPACE \
  --dry-run=client -o yaml | kubectl apply -f -

# Deploy infrastructure
echo "Deploying infrastructure components..."
kubectl apply -f k8s/infrastructure/ -n $NAMESPACE

# Wait for databases
echo "Waiting for databases to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s
kubectl wait --for=condition=ready pod -l app=influxdb -n $NAMESPACE --timeout=300s

# Deploy services
echo "Deploying application services..."
kubectl apply -f k8s/services/ -n $NAMESPACE

# Deploy GPU workloads
echo "Deploying GPU workloads..."
kubectl apply -f k8s/gpu-workloads/ -n $NAMESPACE

# Setup ingress
echo "Configuring ingress..."
kubectl apply -f k8s/ingress/ -n $NAMESPACE

# Wait for deployments
echo "Waiting for deployments to be ready..."
kubectl wait --for=condition=available deployment --all -n $NAMESPACE --timeout=600s

# Run database migrations
echo "Running database migrations..."
kubectl run migrations \
  --image=$REGISTRY/migrations:$VERSION \
  --restart=Never \
  --namespace=$NAMESPACE \
  --wait=true

# Verify deployment
echo "Verifying deployment..."
kubectl get pods -n $NAMESPACE
kubectl get services -n $NAMESPACE
kubectl get ingress -n $NAMESPACE

echo "Deployment complete!"
echo "API available at: https://api.cryptosignalbot.com"
echo "Dashboard available at: https://dashboard.cryptosignalbot.com"
```

### 9.2 Rollback Script

```bash
#!/bin/bash
# rollback.sh - Rollback CryptoSignalBot deployment

set -e

NAMESPACE="crypto-signal-bot"
PREVIOUS_VERSION=${1:-""}

if [ -z "$PREVIOUS_VERSION" ]; then
    echo "Usage: ./rollback.sh <previous-version>"
    exit 1
fi

echo "Rolling back to version: $PREVIOUS_VERSION"

# Get current deployment status
kubectl get deployments -n $NAMESPACE

# Rollback deployments
for deployment in $(kubectl get deployments -n $NAMESPACE -o name); do
    echo "Rolling back $deployment..."
    kubectl set image $deployment \
      *=$REGISTRY/*:$PREVIOUS_VERSION \
      -n $NAMESPACE
done

# Wait for rollback
kubectl rollout status deployment --all -n $NAMESPACE

# Verify rollback
echo "Rollback complete. Current status:"
kubectl get pods -n $NAMESPACE

# Run health checks
./scripts/health-check.sh
```

## 10. Operational Procedures

### 10.1 Model Retraining Procedure

```python
# retrain_models.py
import asyncio
from datetime import datetime, timedelta

async def retrain_models():
    """Automated model retraining procedure"""
    logger.info("Starting model retraining procedure")
    
    # Define training period
    end_date = datetime.now()
    start_date = end_date - timedelta(days=90)  # 3 months of data
    
    try:
        # Initialize trainer
        trainer = ModelTrainer()
        
        # Train new models
        logger.info(f"Training models from {start_date} to {end_date}")
        new_version = await trainer.train_models(
            start_date.isoformat(),
            end_date.isoformat()
        )
        
        # Validate new models
        validator = ModelValidator()
        validation_results = await validator.validate_models(new_version)
        
        if validation_results['passed']:
            logger.info(f"Model validation passed: {validation_results}")
            
            # Deploy new models
            deployer = ModelDeployer()
            await deployer.deploy_models(new_version)
            
            # Monitor performance
            await monitor_new_model_performance(new_version)
            
            logger.info(f"Successfully deployed model version: {new_version}")
        else:
            logger.error(f"Model validation failed: {validation_results}")
            
            # Send alert
            await alert_service.send_admin_alert(
                "Model retraining failed validation",
                validation_results
            )
            
    except Exception as e:
        logger.error(f"Model retraining failed: {e}")
        await alert_service.send_admin_alert(
            "Model retraining error",
            str(e)
        )

async def monitor_new_model_performance(version: str, duration: int = 3600):
    """Monitor new model performance for specified duration"""
    start_time = time.time()
    metrics = []
    
    while time.time() - start_time < duration:
        # Collect performance metrics
        current_metrics = await collect_model_metrics(version)
        metrics.append(current_metrics)
        
        # Check for anomalies
        if current_metrics['error_rate'] > 0.05:  # 5% error threshold
            logger.error(f"High error rate detected: {current_metrics['error_rate']}")
            
            # Rollback to previous version
            await rollback_models()
            break
        
        await asyncio.sleep(60)  # Check every minute
    
    # Generate performance report
    report = generate_performance_report(metrics)
    await send_performance_report(report)

if __name__ == "__main__":
    asyncio.run(retrain_models())
```

### 10.2 Disaster Recovery Procedure

```python
# disaster_recovery.py
class DisasterRecovery:
    def __init__(self):
        self.backup_service = BackupService()
        self.restore_service = RestoreService()
        self.health_checker = HealthChecker()
    
    async def execute_recovery(self, failure_type: str):
        """Execute disaster recovery based on failure type"""
        logger.critical(f"Initiating disaster recovery for: {failure_type}")
        
        recovery_procedures = {
            'database_failure': self.recover_database,
            'service_failure': self.recover_services,
            'data_corruption': self.recover_from_backup,
            'complete_failure': self.full_recovery
        }
        
        procedure = recovery_procedures.get(failure_type)
        if procedure:
            await procedure()
        else:
            logger.error(f"Unknown failure type: {failure_type}")
    
    async def recover_database(self):
        """Recover from database failure"""
        logger.info("Starting database recovery")
        
        # Check primary database
        if not await self.health_checker.check_database():
            # Failover to replica
            await self.failover_to_replica()
            
            # Restore primary from backup
            latest_backup = await self.backup_service.get_latest_backup('database')
            await self.restore_service.restore_database(latest_backup)
            
            # Resync replica
            await self.resync_database_replica()
    
    async def recover_services(self):
        """Recover failed services"""
        failed_services = await self.health_checker.get_failed_services()
        
        for service in failed_services:
            logger.info(f"Recovering service: {service}")
            
            # Restart service
            await self.restart_service(service)
            
            # Wait for health check
            if not await self.wait_for_healthy(service, timeout=300):
                # Deploy previous version
                await self.deploy_previous_version(service)
    
    async def full_recovery(self):
        """Complete system recovery"""
        logger.critical("Executing full system recovery")
        
        # Stop all services
        await self.stop_all_services()
        
        # Restore databases
        await self.restore_all_databases()
        
        # Restore services in order
        service_order = [
            'postgres',
            'influxdb',
            'redis',
            'kafka',
            'feature-engineering',
            'prediction-api',
            'alert-service',
            'dashboard'
        ]
        
        for service in service_order:
            await self.start_service(service)
            await self.wait_for_healthy(service)
        
        # Verify system integrity
        await self.verify_system_integrity()
```

## 11. Configuration Management

### 11.1 Environment Configuration

```yaml
# config/production.yaml
api:
  host: "0.0.0.0"
  port: 8000
  workers: 4
  timeout: 30
  rate_limit:
    default: 100
    premium: 1000
    enterprise: 10000

database:
  postgres:
    host: "${POSTGRES_HOST}"
    port: 5432
    database: "cryptosignalbot"
    pool_size: 20
    max_overflow: 40
    
  influxdb:
    url: "http://${INFLUXDB_HOST}:8086"
    org: "crypto_trading"
    bucket: "market_data"
    retention: "365d"
    
  redis:
    host: "${REDIS_HOST}"
    port: 6379
    db: 0
    decode_responses: true

models:
  batch_size: 32
  gpu_memory_fraction: 0.8
  inference_timeout: 2.0
  cache_ttl: 300

monitoring:
  prometheus:
    enabled: true
    port: 9090
  
  jaeger:
    enabled: true
    agent_host: "jaeger"
    agent_port: 6831
    
  logging:
    level: "INFO"
    format: "json"
    output: "stdout"

features:
  sentiment:
    model: "ProsusAI/finbert"
    max_length: 512
    batch_timeout: 0.5
    
  technical:
    indicators:
      - RSI
      - MACD
      - BollingerBands
      - VWAP
    gpu_acceleration: true

alerts:
  check_interval: 30
  notification_cooldown: 300
  max_retries: 3
  
security:
  jwt_algorithm: "HS256"
  api_key_length: 32
  encryption_algorithm: "AES256"
  tls_version: "1.3"
```

### 11.2 Feature Flags

```python
class FeatureFlags:
    def __init__(self):
        self.flags = {
            'use_gpu_inference': True,
            'enable_websocket_compression': True,
            'use_advanced_calibration': True,
            'enable_model_versioning': True,
            'use_distributed_tracing': True,
            'enable_rate_limiting': True,
            'use_cache_warming': True,
            'enable_graceful_degradation': True,
            'use_circuit_breaker': True,
            'enable_ab_testing': False
        }
        
        # Load from environment or config service
        self._load_from_environment()
    
    def is_enabled(self, feature: str) -> bool:
        """Check if feature is enabled"""
        return self.flags.get(feature, False)
    
    def _load_from_environment(self):
        """Load feature flags from environment variables"""
        for flag in self.flags:
            env_var = f"FEATURE_{flag.upper()}"
            if env_var in os.environ:
                self.flags[flag] = os.environ[env_var].lower() == 'true'
    
    async def update_flag(self, feature: str, enabled: bool):
        """Update feature flag dynamically"""
        if feature in self.flags:
            self.flags[feature] = enabled
            logger.info(f"Feature flag updated: {feature} = {enabled}")
            
            # Notify services of change
            await self._notify_flag_change(feature, enabled)
    
    async def _notify_flag_change(self, feature: str, enabled: bool):
        """Notify services of feature flag change"""
        # Publish to message queue or use service discovery
        pass
```

This completes the detailed design document for the Sentiment-Driven Ensemble Trading Signal Bot. The design covers all major components including data ingestion, feature engineering, model inference, API services, monitoring, security, and operational procedures.