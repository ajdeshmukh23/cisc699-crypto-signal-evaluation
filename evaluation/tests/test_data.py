import pandas as pd

from signal_eval.data import validate


def _frame(index):
    return pd.DataFrame({"open": 1.0, "high": 2.0, "low": 0.5, "close": 1.5, "volume": 10.0},
                        index=pd.DatetimeIndex(index, tz="UTC"))


def test_validate_clean_series():
    report = validate(_frame(pd.date_range("2024-01-01", periods=5, freq="1h")))
    assert report["rows"] == 5 and report["missing_candles"] == 0 and report["duplicates"] == 0


def test_validate_detects_gap_and_bad_ohlc():
    idx = pd.date_range("2024-01-01", periods=5, freq="1h").delete(2)
    df = _frame(idx)
    df.iloc[0, df.columns.get_loc("high")] = 0.1
    report = validate(df)
    assert report["missing_candles"] == 1
    assert report["bad_ohlc"] == 1
