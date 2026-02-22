from fastapi import FastAPI, Header, HTTPException
import numpy as np
from sklearn.linear_model import LogisticRegression
import pandas as pd
import os
from sqlalchemy import create_engine

app = FastAPI()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

model = LogisticRegression()


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


@app.middleware("http")
async def check_internal_auth(request, call_next):
    if request.headers.get("X-Internal-Secret") != os.getenv("ML_INTERNAL_SECRET"):
        raise HTTPException(status_code=403)
    return await call_next(request)


@app.post("/train")
def train():
    result = train_model()
    return {"trained": bool(result)}


@app.post("/predict")
def predict(payload: dict):
    features = np.array([[
        payload["funding_amount"],
        payload["annual_revenue"],
        payload["time_in_business"],
    ]])
    prob = model.predict_proba(features)[0][1]
    return {"approval_probability": float(prob)}
