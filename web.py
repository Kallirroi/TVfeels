from flask import Flask, jsonify
from glue_data import get_all_trends, TRENDS_BUFFER_DAYS, SUBTITLES_SCENES_BUFFER_DAYS
from util import millis, MILLIS_IN_DAY
import json

app = Flask(__name__, static_folder="client/public", static_url_path='')
app.debug = True

FRESHNESS_BUFFER = 1000 * 60 * 60


@app.route('/')
def root():
    return app.send_static_file("index.html")


@app.route('/api/trends')
def get_trends():
    try:
        with open('trends.json') as in_file:
            data = json.load(in_file)
    except IOError as e:
        data = {
            "trends": [],
            "created_at": 0
        }

    if millis() - data["created_at"] > FRESHNESS_BUFFER:
        data["trends"] = []
        # generate
        for to_timestamp in range(millis(), millis() - SUBTITLES_SCENES_BUFFER_DAYS * MILLIS_IN_DAY,
                                  -TRENDS_BUFFER_DAYS * MILLIS_IN_DAY):
            from_timestamp = to_timestamp - TRENDS_BUFFER_DAYS * MILLIS_IN_DAY
            trends = get_all_trends(from_timestamp, to_timestamp)
            data["trends"].append({
                "from_timestamp": from_timestamp,
                "to_timestamp": to_timestamp,
                "trends": trends
            })
        data["created_at"] = millis()
        with open('trends.json', 'w') as outfile:
            json.dump(data, outfile)

    return jsonify(data)


@app.route('/api/health')
def health():
    return jsonify({"status": "ok"})


if __name__ == '__main__':
    app.run(host='0.0.0.0')
