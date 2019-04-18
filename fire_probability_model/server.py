import pandas as pd
from glob import glob
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.metrics import confusion_matrix
from sklearn.metrics import roc_auc_score, accuracy_score
from xgboost import XGBClassifier

from flask import Flask
app = Flask(__name__)
from flask import request

def testThatItWorks():
    filenames =glob('./data/2001*.csv')
    print(filenames)
    data_list = [pd.read_csv(f) for f in filenames]
    df = pd.concat(data_list, axis=0, ignore_index=True)
    df = df.loc[:, ['elevation', 'PRCP', 'TMAX', 'TMIN', 'fire']]
    df.dropna(axis='rows', inplace = True)
    new_df = df.reset_index(drop=True)

    print("No fire:", new_df['fire'][new_df['fire'] == 0].count()) #class = 0
    print("Fire:", new_df['fire'][new_df['fire'] == 1].count()) #class = 1

    X = new_df.drop('fire', axis=1)
    y = new_df['fire']
    X_train, X_test, y_train, y_test = train_test_split(X.values, y.values, test_size = 0.20, random_state=1)
    print(X_test)

xgb = XGBClassifier()
xgb.load_model('./fire_probability.model')

def predict_prob(row):
    df = pd.DataFrame(data=[row])
    xgb_pred_prob = xgb.predict_proba(df) #Feed in API data here
    return xgb_pred_prob

@app.route("/predict", methods=['POST'])
def predict():
    req_data = request.get_json()
    print(req_data)
    elev = req_data['elevation']
    prec = req_data['PRCP']
    tmax = req_data['TMAX']
    tmin = req_data['TMIN']
    prob = predict_prob([float(elev), float(prec), float(tmax), float(tmin)])
    return str(prob)

