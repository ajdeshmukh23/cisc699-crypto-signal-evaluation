"""Download and validate hourly OHLCV candles from Binance's public data archive.

Source: https://data.binance.vision (monthly spot kline ZIPs, no API key needed).
"""
from __future__ import annotations

import io
import zipfile
from pathlib import Path

import pandas as pd
import requests

BASE_URL = "https://data.binance.vision/data/spot/monthly/klines/{symbol}/{interval}/{symbol}-{interval}-{month}.zip"
COLUMNS = ["open_time", "open", "high", "low", "close", "volume", "close_time",
           "quote_volume", "trades", "taker_buy_base", "taker_buy_quote", "ignore"]
RAW_DIR = Path(__file__).resolve().parents[2] / "data" / "raw"


def download_month(symbol: str, interval: str, month: str) -> pd.DataFrame:
    """Fetch one month (e.g. '2024-01') of klines and return a UTC-indexed frame."""
    url = BASE_URL.format(symbol=symbol, interval=interval, month=month)
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()
    with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
        with zf.open(zf.namelist()[0]) as fh:
            df = pd.read_csv(fh, header=None, names=COLUMNS)
    # Binance switched spot timestamps from ms to us in 2025; normalise both.
    unit = "us" if df["open_time"].iloc[0] > 10**14 else "ms"
    df["open_time"] = pd.to_datetime(df["open_time"], unit=unit, utc=True)
    df = df.set_index("open_time")[["open", "high", "low", "close", "volume"]].astype(float)
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(RAW_DIR / f"{symbol}-{interval}-{month}.csv")
    return df


def validate(df: pd.DataFrame, freq: str = "1h") -> dict:
    """Basic quality report: ordering, duplicates, gaps and OHLC consistency."""
    expected = pd.date_range(df.index.min(), df.index.max(), freq=freq)
    return {
        "rows": len(df),
        "start": str(df.index.min()),
        "end": str(df.index.max()),
        "sorted": bool(df.index.is_monotonic_increasing),
        "duplicates": int(df.index.duplicated().sum()),
        "missing_candles": int(len(expected.difference(df.index))),
        "bad_ohlc": int(((df["high"] < df[["open", "close"]].max(axis=1)) |
                         (df["low"] > df[["open", "close"]].min(axis=1))).sum()),
    }


if __name__ == "__main__":
    import json
    import sys

    symbol, month = (sys.argv[1:3] if len(sys.argv) >= 3 else ("BTCUSDT", "2024-01"))
    frame = download_month(symbol, "1h", month)
    print(json.dumps({"symbol": symbol, "month": month, **validate(frame)}, indent=2))
