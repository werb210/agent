from fastapi import FastAPI, Header, HTTPException
import numpy as np
from sklearn.linear_model import LogisticRegression
import pandas as pd
import torch
import torch.nn as nn
import os
from sqlalchemy import create_engine
from deep_model import ApprovalNN
from time_series import forecast_revenue

app = FastAPI()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

model = LogisticRegression()

nn_model = ApprovalNN()
optimizer = torch.optim.Adam(nn_model.parameters(), lr=0.001)
loss_fn = nn.BCELoss()


def load_training_data():
    query = """
    SELECT funding_amount,
           annual_revenue,
           time_in_business,
           CASE WHEN status='funded' THEN 1 ELSE 0 END as outcome
    FROM sessions
    WHERE funding_amount IS NOT NULL
    """
    df = pd.read_sql(query, engine)
    return df


def train_model():
    df = load_training_data()
    if len(df) < 10:
        return None
    X = df[["funding_amount", "annual_revenue", "time_in_business"]]
    y = df["outcome"]
    model.fit(X, y)
    return True


def train_nn():
    df = load_training_data()
    if len(df) < 20:
        return False

    X = torch.tensor(df[["funding_amount", "annual_revenue", "time_in_business"]].values, dtype=torch.float32)
    y = torch.tensor(df["outcome"].values.reshape(-1, 1), dtype=torch.float32)

    for _ in range(100):
        optimizer.zero_grad()
        outputs = nn_model(X)
        loss = loss_fn(outputs, y)
        loss.backward()
        optimizer.step()

    return True


@app.middleware("http")
async def check_internal_auth(request, call_next):
    if request.headers.get("X-Internal-Secret") != os.getenv("ML_INTERNAL_SECRET"):
        raise HTTPException(status_code=403)
    return await call_next(request)


@app.post("/train")
def train():
    logistic_result = train_model()
    nn_result = train_nn()
    return {"trained": bool(logistic_result), "nn_trained": bool(nn_result)}


@app.post("/predict")
def predict(payload: dict):
    features = np.array([[
        payload["funding_amount"],
        payload["annual_revenue"],
        payload["time_in_business"],
    ]])
    prob = model.predict_proba(features)[0][1]
    return {"approval_probability": float(prob)}


@app.post("/predict-nn")
def predict_nn(payload: dict):
    features = torch.tensor([[
        payload["funding_amount"],
        payload["annual_revenue"],
        payload["time_in_business"]
    ]], dtype=torch.float32)

    prob = nn_model(features).item()
    return {"approval_probability": prob}


@app.post("/forecast")
def forecast(payload: dict):
    return {"forecast": forecast_revenue(payload["history"])}
