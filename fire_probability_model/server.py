import pandas as pd
from glob import glob
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.metrics import confusion_matrix
from sklearn.metrics import roc_auc_score, accuracy_score
from xgboost import XGBClassifier

from flask import Flask
app = Flask(__name__)

filenames = glob('*.csv')
data_list = [pd.read_csv(f) for f in filenames]
df = pd.concat(data_list, axis=0, ignore_index=True)
df = df.loc[:, ['elevation','PRCP','TMAX','TMIN','fire']]
df.dropna(axis='rows', inplace = True)
new_df = df.reset_index(drop=True)

#Get class distribution
print("No fire:", new_df['fire'][new_df['fire'] == 0].count()) #class = 0
print("Fire:", new_df['fire'][new_df['fire'] == 1].count()) #class = 1

# Split into training and testing sets
X = new_df.drop('fire', axis=1)
y = new_df['fire']
X_train, X_test, y_train, y_test = train_test_split(X.values, y.values, test_size = 0.20, random_state=1)

#XGBoost default hyperparameters - Balanced Class Weights
weights = (y==0).sum()/(1.0 *  (y==1).sum())
xgb = XGBClassifier(random_state=1, scale_pos_weight = weights, n_jobs = -1)
xgb.fit(X_train, y_train)
xgb_pred = xgb.predict(X_test)

print("XGBoost - Testing Accuracy:", (round(accuracy_score(y_test, xgb_pred.round(0)), 2)))
print('\n')
print(confusion_matrix(y_test, xgb_pred))
print('\n')
print(classification_report(y_test, xgb_pred))
print('\n')
print("ROC AUC Score:", roc_auc_score(y_test,xgb_pred))

#Predict Probability of being in Class 1
xgb_pred_prob = xgb.predict_proba(X_test) #Feed in API data here
