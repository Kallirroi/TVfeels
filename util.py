import logging
import time

MILLIS_IN_DAY = 86400000

logger = logging.getLogger('super-trends')
logger.setLevel(logging.DEBUG)
stream = logging.StreamHandler()
stream.setLevel(logging.DEBUG)
stream.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(stream)


def to_str(objs):
    str_arr = []
    for obj in objs:
        try:
            str_arr.append(str(obj))
        except UnicodeEncodeError:
            str_arr.append("<err>")
    return ' '.join(str_arr)


def log(*objs):
    logger.info(to_str(objs))


def error(*objs):
    logger.error(to_str(objs))


def millis():
    return int(round(time.time() * 1000))
