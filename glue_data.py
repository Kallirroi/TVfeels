import os
from pymongo import MongoClient, TEXT
from util import log, error, millis, MILLIS_IN_DAY

# MONGO
MONGO_DEFAULT_URL = 'mongodb://um.media.mit.edu:27017/super-glue'
MONGO_URL = os.environ.get('MONGO_URL')
if MONGO_URL is None:
    error("No MONGO_URL in environment. Defaulting to", MONGO_DEFAULT_URL)
    MONGO_URL = MONGO_DEFAULT_URL
MONGO_CLIENT = MongoClient(MONGO_URL)
DB = MONGO_CLIENT.get_default_database()
MEDIA_COLLECTION = DB['media']
SUBTITLES_SCENES_COLLECTION_NAME = "subtitles_scenes_aggregation"
SUBTITLES_SCENES_COLLECTION = DB[SUBTITLES_SCENES_COLLECTION_NAME]
# /MONGO

MINIMAL_SCENE_LENGTH = 1000
SUBTITLES_SCENES_BUFFER_DAYS = int(os.environ.get('SUBTITLES_SCENES_BUFFER_DAYS', '7'))
TRENDS_BUFFER_DAYS = int(os.environ.get('TRENDS_BUFFER_DAYS', '1'))


def get_trends_for(category, from_timestamp, to_timestamp, disambiguations=None, limit=5):
    """

    :param category:
    :param from_timestamp:
    :param to_timestamp:
    :param disambiguations:
    :param limit:
    :return:
    """
    if not disambiguations:
        disambiguations = {}

    cursor = MEDIA_COLLECTION.aggregate(
            [
                {"$match": {"date_added": {
                    "$gt": from_timestamp,
                    "$lt": to_timestamp
                }}},
                {"$project": {"entities_aligned": 1}},
                {"$unwind": "$entities_aligned"},
                {"$group": {
                    "_id": {
                        "text": "$entities_aligned.text",
                        "type": "$entities_aligned.type"
                    },
                    "count": {"$sum": 1}
                }},
                {"$match": {"_id.type": category}},
                {"$sort": {"count": -1}},
                {"$limit": limit * 2}
            ]
    )
    count_dict = {}
    for obj in cursor:
        text = obj["_id"]["text"]
        count = obj["count"]
        if text in disambiguations:
            text = disambiguations[text]
        if text in count_dict:
            count_dict[text] += count
        else:
            count_dict[text] = count
    ret_val = [{
                   "text": key,
                   "count": value,
                   "scenes": get_scenes_per_entity(key)
               } for key, value in count_dict.iteritems()]
    return sorted(ret_val, key=lambda item: item['count'], reverse=True)[0:limit]


def get_all_trends(from_timestamp, to_timestamp):
    """

    :param from_timestamp:
    :param to_timestamp:
    :return:
    """
    return {
        "PEOPLE": get_trends_for("Person", from_timestamp, to_timestamp,
                                 {"OBAMA": "BARACK OBAMA", "PRESIDENT OBAMA": "BARACK OBAMA",
                                  "YOGI BERRA.": "YOGI BERRA", "SENATOR BERNIE SANDERS" : "BERNIE SANDERS", "ALI" : "MUHAMMAD ALI"}),
        "COUNTRIES": get_trends_for("Country", from_timestamp, to_timestamp, {"US": "U.S.", "US.": "U.S."}),
        "ORGANIZATIONS": get_trends_for("Organization", from_timestamp, to_timestamp, {"REPUBLICAN": "REPUBLICANS"}),
        "COMPANIES": get_trends_for("Company", from_timestamp, to_timestamp),
        "STATES": get_trends_for("StateOrCounty", from_timestamp, to_timestamp, {"WASHINGTON.": "WASHINGTON", "IOWA.": "IOWA"}),
    }


def unwind_subtitles_and_scenes(from_timestamp, to_timestamp):
    """
    create a collection that maps subtitles to scenes in a specific time range
    !! this is a long aggregation and should not be activated for fast response !!
    :param from_timestamp: lower timestamp bound (millis)
    :param to_timestamp: upper timestamp bound (millis)
    :return: nothing but creates a new collection in the db (subtitles_scenes_aggregation)
    """
    log("unwinding subtitles and scenes with buffer (days) :", SUBTITLES_SCENES_BUFFER_DAYS)
    MEDIA_COLLECTION.aggregate(
            [
                {"$match": {
                    "date_added": {
                        "$gt": from_timestamp,
                        "$lt": to_timestamp
                    }
                }},
                {"$project": {
                    "media_url": 1,
                    "closed_captions_aligned": 1,
                    "scenes": 1,
                    "date_added": 1,
                }},
                {"$unwind": "$closed_captions_aligned"},
                {"$unwind": "$scenes"},
                {"$project": {
                    "_id": 0,
                    "date_added": 1,
                    "media_url": 1,
                    "closed_captions_aligned": 1,
                    "scenes": 1,
                    "start_cmp": {"$cmp": ['$closed_captions_aligned.start', '$scenes.begin']},
                    "end_cmp": {"$cmp": ['$closed_captions_aligned.end', '$scenes.end']}
                }},
                {"$match": {
                    "start_cmp": {"$gt": 0},
                    "end_cmp": {"$lt": 0},
                }},
                {"$out": SUBTITLES_SCENES_COLLECTION_NAME}
            ]
    )
    log("indexing subtitles and scenes in", SUBTITLES_SCENES_COLLECTION_NAME)
    SUBTITLES_SCENES_COLLECTION.create_index([("closed_captions_aligned.text", TEXT)])


def get_scenes_per_entity(entity, from_timestamp=millis() - SUBTITLES_SCENES_BUFFER_DAYS * MILLIS_IN_DAY,
                          to_timestamp=millis()):
    """
    get all scenes that match a specific entity per specific time range
    :param entity:
    :param from_timestamp: lower timestamp bound (millis)
    :param to_timestamp: upper timestamp bound (millis)
    :return: a list of relevant scenes. each with media_url, start (millis), end (millis), length (millis), thumbnail
    url and score
    """
    log("aggregating scenes for", entity)
    cursor = SUBTITLES_SCENES_COLLECTION.aggregate(
            [
                {"$match": {
                    "$text": {"$search": entity}
                }},
                {"$match": {
                    "date_added": {
                        "$gt": from_timestamp,
                        "$lt": to_timestamp
                    },
                }},
                {"$project": {
                    "_id": 1,
                    "media_url": 1,
                    "scenes": 1,
                    "score": {"$meta": "textScore"},
                    "closed_captions_aligned": 1
                }},
                {"$group": {
                    "_id": {
                        "media_url": "$media_url",
                        "scene_start": "$scenes.begin",
                        "scene_end": "$scenes.end",
                        "scene_length": {"$subtract": ["$scenes.end", "$scenes.begin"]},
                        "scene_thumbnail_url": "$scenes.thumbnail_url",
                    },
                    "score": {"$sum": "$score"},
                    "first_timestamp": {"$min": "$closed_captions_aligned.start"}
                }},
                {"$match": {
                    "_id.scene_length": {"$gt": MINIMAL_SCENE_LENGTH}
                }},
                {"$sort": {
                    "score": -1
                }},
                {"$limit": 5}
            ]
    )
    return [{
                "media_url": obj["_id"]["media_url"],
                "start": obj["_id"]["scene_start"],
                "end": obj["_id"]["scene_end"],
                "length": obj["_id"]["scene_length"],
                "thumbnail": obj["_id"]["scene_thumbnail_url"] if "scene_thumbnail_url" in obj["_id"] else None,
                "score": obj["score"],
                "first_timestamp": obj["first_timestamp"]
            } for obj in cursor]


if __name__ == '__main__':
    unwind_subtitles_and_scenes(millis() - SUBTITLES_SCENES_BUFFER_DAYS * MILLIS_IN_DAY, millis())
