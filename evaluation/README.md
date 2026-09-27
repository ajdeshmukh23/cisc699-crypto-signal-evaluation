# signal_eval

Python module for the CISC 699 extension: historical replay of the dashboard's
rule-based signals, and walk-forward evaluation of ML signal models
(logistic regression, LightGBM, LSTM) against them.

```sh
cd evaluation
/opt/homebrew/bin/python3.13 -m venv .venv && source .venv/bin/activate
pip install pandas numpy requests pytest
python -m signal_eval.data BTCUSDT 2024-01   # download + quality report
python -m pytest -q
```
