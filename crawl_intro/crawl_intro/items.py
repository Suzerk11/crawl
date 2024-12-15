# Define here the models for your scraped items
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/items.html

import scrapy


class CrawlIntroItem(scrapy.Item):
    # define the fields for your item here like:
    id = scrapy.Field()
    first_name = scrapy.Field()
    last_name = scrapy.Field()
    avatar = scrapy.Field()
    title = scrapy.Field()
    description = scrapy.Field()
    short_description = scrapy.Field()
    instagram = scrapy.Field()
    twitter = scrapy.Field()
    linkedin = scrapy.Field()
    youtube = scrapy.Field()
    tiktok = scrapy.Field()
    session_price = scrapy.Field()
    session_duration = scrapy.Field()
    rating = scrapy.Field()
    rating_count = scrapy.Field()
    verified = scrapy.Field()
    url = scrapy.Field()
    top_expert = scrapy.Field()
    vector = scrapy.Field()

