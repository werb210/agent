import numpy as np


def forecast_revenue(history, months=3):
    avg_growth = np.mean(np.diff(history) / history[:-1])
    forecasts = []
    last = history[-1]

    for _ in range(months):
        next_val = last * (1 + avg_growth)
        forecasts.append(next_val)
        last = next_val

    return forecasts
