import sys
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
import arff

def train_model(filepath, user_data=None):
    try:
        with open(filepath, 'r', encoding='utf-8') as file:
            dataset = arff.load(file)
    except FileNotFoundError:
        print(f"Error: The file '{filepath}' was not found.")
        return
    except Exception as e:
        print(f"An error occurred while loading the file: {e}")
        return

    data = dataset['data']
    X = [row[:-1] for row in data]
    y = [row[-1] for row in data]

    X = [[np.nan if val == '?' else val for val in row] for row in X]

    X = np.array(X, dtype=float)
    y = np.array(y, dtype=float)

    imputer = SimpleImputer(strategy='mean')
    X = imputer.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=100, shuffle=True)

    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)

    clf = MLPClassifier(
        
        hidden_layer_sizes=(16),
        max_iter=100,
        solver='adam',
        learning_rate_init=0.005,
        alpha=0.01,
        early_stopping=True,
        batch_size=128,
        random_state=100
    )
    
    try:
        clf.fit(X_train, y_train)
    except Exception as e:
        print(f"An error occurred while training the model: {e}")
        return

    y_pred = clf.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average='weighted')
    precision = precision_score(y_test, y_pred, average='weighted', zero_division=1)
    recall = recall_score(y_test, y_pred, average='weighted')
    
    prediction_mapping = {0.0: 'CS', 1.0: 'IT'}

    user_prediction = None
    if user_data:
        user_data = [float(val) if val != '?' else np.nan for val in user_data]
        try:
            user_data = [np.nan if val == '?' else float(val) for val in user_data]
            user_data = imputer.transform([user_data])[0]
            user_data = scaler.transform([user_data])[0]
            
            user_prediction = clf.predict([user_data])[0]
            user_prediction_label = prediction_mapping.get(user_prediction, 'Unknown')
        except NotFittedError as e:
            print(f"Model is not fitted yet: {e}")
            return
        except Exception as e:
            print(f"An error occurred while predicting user data: {e}")
            return
    
    print(f'Accuracy: {round(accuracy * 100)}%')
    print(f'F1-Score: {round(f1 * 100)}%')
    print(f'Precision: {round(precision * 100)}%')
    print(f'Recall: {round(recall * 100)}%')

    if user_prediction is not None:
        print(f'Prediction: {user_prediction_label}')

if __name__ == '__main__':
    filepath = sys.argv[1]
    user_data = sys.argv[2:] if len(sys.argv) > 2 else None
    train_model(filepath, user_data)

