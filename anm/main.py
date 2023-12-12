import time
import threading
nowcasting_url = "https://www.meteoromania.ro/wp-json/meteoapi/v2/avertizari-nowcasting"
import hashlib
import requests
import json
import re
from datetime import datetime,timedelta
import sqlite3

template = {"data":{
    "start": "2023-01-28T12:00:00.000Z",
    "final": "2023-01-29T08:00:00.000Z",
    "titlu": "title",
    "continut": "content",
    "organizatie": 2,
    "judete": [13, 32, 15],
    "coduri_alerta": 2,
    "locale": "ro"
}}



def send_data(url,data):
    try:
        # Send a POST request with the JSON data
        response = requests.post(url, json={"data":data})

        # Check if the request was successful (status code 200)
        if response.status_code == 200:
            print("POST request was successful")
        else:
            print("POST request failed with status code:", response.text)

    except requests.exceptions.RequestException as e:
        print("Request error:", e)
    except Exception as e:
        print("An error occurred:", e)
# URL containing the JSON data
def read_data(url):

    try:
        # Send a GET request to the URL
        response = requests.get(url)
        data = None
        # Check if the request was successful (status code 200)
        if response.status_code == 200:
            # Parse the JSON data from the response
            data = response.json()

            # Now you can work with the JSON data
            return data
        else:
            print("Failed to retrieve data. Status code:", response.status_code)

    except requests.exceptions.RequestException as e:
        print("Request error:", e)
    except json.JSONDecodeError as e:
        print("JSON parsing error:", e)
    except Exception as e:
        print("An error occurred:", e)
    finally:
        return data

def run_api():
    connection = sqlite3.connect('anm.db')
    cursor = connection.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS alerts (id INTEGER PRIMARY KEY, uniqueid TEXT)''')

    with open("./judete.json","r") as file:
        data = json.loads(file.read().strip())
        countyJSON = {}
        colorJSON = {
            "galben":3,
            "portocaliu":2,
            "roșu":1,
            "rosu":1
        }
        for item in data['data']:
            countyJSON[item['attributes']['nume']] = item['id']

        pattern = "|".join(list(countyJSON.keys()))

        alerts = read_data(nowcasting_url)

        if alerts is not None and type(alerts).__name__ != 'str':

            if type(alerts['avertizare']).__name__ == 'dict':
                alerts['avertizare'] = [alerts['avertizare']]

            for alert in alerts['avertizare']:
                print(alert)
                text = alert['@attributes']['zona']
                matches = re.findall(pattern, text)
                color = colorJSON[alert['@attributes']['numeCuloare']]

                if matches:
                    areaSets = set()
                    for item in matches:
                        areaSets.add(countyJSON[item])
                    print("Matched groups:", list(areaSets),matches,color)
                    time_difference = timedelta(hours=-2)
                    try:
                        datetime_object = datetime.strptime(alert['@attributes']["dataInceput"], "%Y-%m-%dT%H:%M") + time_difference
                    except Exception as e:
                        date, hours = alert['@attributes']["dataInceput"].split("T")
                        h,m = hours.split(":")
                        h= h[::-1] if int(h) > 23 else h

                        try:
                            alert['@attributes']["dataInceput"] = f"{date}T{h}:{m}"
                            datetime_object = datetime.strptime(f"{date}T{h}:{m}", "%Y-%m-%dT%H:%M") + time_difference
                        except Exception as e:
                            print("Failed twice")
                            print(e)
                            continue

                    try:
                        finish_time = datetime.strptime(alert['@attributes']["dataSfarsit"],
                                                        "%Y-%m-%dT%H:%M") + time_difference
                    except Exception as e:
                        date, hours = alert['@attributes']["dataSfarist"].split("T")
                        h, m = hours.split(":")
                        h = h[::-1] if int(h) > 23 else h

                        try:
                            alert['@attributes']["dataSfarist"] = f"{date}T{h}:{m}"
                            finish_time = datetime.strptime(f"{date}T{h}:{m}",
                                                                "%Y-%m-%dT%H:%M") + time_difference
                        except Exception as e:
                            print("Failed twice")
                            print(e)
                            continue

                    #date_part, time_part = alert['@attributes']["dataSfarsit"].split('T')
                    # Extract the hour value from the time_part
                    #finish_time = datetime_object + timedelta(minutes=int(time_part.split(':')[0]))
                    hash_object = hashlib.sha256()

                    data = alert['@attributes']["dataInceput"].strip() + alert['@attributes']["dataSfarsit"].strip() + alert['@attributes']['zona'].strip()
                    # Update the hash object with the input data
                    hash_object.update(data.encode('utf-8'))

                    # Get the hexadecimal representation of the hash
                    unique_hash = hash_object.hexdigest()

                    print("Unique Hash:", unique_hash)
                    alertJSON = {
                        'start':datetime_object.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
                        'final':finish_time.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
                        'titlu':alert['@attributes']["numeTipMesaj"] + " : Cod " + alert['@attributes']['numeCuloare'],
                        'continut':(alert['@attributes']["semnalare"] + "\n" + text).replace("<br>","").replace("<br/>",""),
                        'locale':'ro',
                        'organizatie':2,
                        'coduri_alerta':color,
                        'judete':list(areaSets),
                        'publishedAt':None
                    }
                    cursor.execute(f"SELECT * FROM alerts WHERE uniqueid='{unique_hash}'")
                    row = cursor.fetchone()
                    if row is None:
                        cursor.execute("INSERT INTO alerts (uniqueid) VALUES (?)", (str(unique_hash),))
                        connection.commit()

                        send_data("http://localhost:1337/api/alerts",alertJSON)
                else:
                    print("No matches found.")
        else:
            print("NO ALERTS")
def run():
    while True:
        try:
            run_api()
        except Exception as err:
            print(err)
        print("repeating")
        time.sleep(60*10)

threading.Thread(target=run,args=()).start()
