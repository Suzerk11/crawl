import scrapy
import json
from enum import Enum
from crawl_intro.items import CrawlIntroItem
from scrapy_selenium import SeleniumRequest

class Topic(Enum):
    TOP_EXPERTS = 661
    WELLNESS = 151
    HOME = 117
    CAREER = 1222
    STYLE = 100

class IntroSpider(scrapy.Spider):
    name = "intro"
    allowed_domains = ["intro.co"]
    # start_urls = ["https://intro.co"]
    # start_urls = ['https://intro.co/marketplace?topic=Top%20Experts']

    def __init__(self, *args, **kwargs):
        super(IntroSpider, self).__init__(*args, **kwargs)
        self.limit = kwargs.get('limit', 24)


    def start_requests(self):
        for topic in Topic:
            offset = 0
            url = f"https://api.intro.co/experts?TopicId={topic.value}&Offset={offset}&Limit={self.limit}"
            yield SeleniumRequest(url=url, callback=self.parse, meta={'topic_id': topic.value, 'offset': offset})


    def parse(self, response):
        # with open("response.html", "wb") as f:
        #     f.write(response.body)


        data = json.loads(response.text)
        experts = data.get('Data', [])
        topic_id = response.meta['topic_id']
        offset = response.meta['offset']

        if not experts:
            self.logger.error("No experts found in the data")
            return

        for expert in experts:
            item = CrawlIntroItem()
            item['id'] = expert.get('Id', '')
            item['first_name'] = expert.get('FirstName', '').lower().strip()
            item['last_name'] = expert.get('LastName', '').lower().strip()
            item['avatar'] = expert.get('Avatar', '')
            item['title'] = expert.get('Title', '').strip()
            item['description'] = expert.get('Description', '').strip()
            item['short_description'] = expert.get('ShortDescription', '').strip()
            item['instagram'] = 'https://www.instagram.com/' + expert.get('Instagram', '').strip() if expert.get('Instagram') else ''
            item['twitter'] = 'https://www.twitter.com/' + expert.get('Twitter', '').strip() if expert.get('Twitter') else ''
            item['linkedin'] = 'https://www.linkedin.com/in/' + expert.get('LinkedIn', '').strip() if expert.get('LinkedIn') else ''
            item['youtube'] = 'https://www.youtube.com/@' + expert.get('YouTube', '').strip() if expert.get('YouTube') else ''
            item['tiktok'] = 'https://www.tiktok.com/@' + expert.get('TikTok', '').strip() if expert.get('TikTok') else ''
            item['session_price'] = expert.get('SessionPrice', 0)
            item['session_duration'] = expert.get('SessionDuration', 0)
            item['rating'] = expert.get('Rating', 0)
            item['rating_count'] = expert.get('RatingCount', 0)
            item['verified'] = expert.get('Verified', False)
            item['url'] = expert.get('Url', '').strip()
            item['top_expert'] = expert.get('TopExpert', False)
            yield item
        offset += self.limit
        total_count = data.get('TotalCount', 0)
        # self.limit = total_count

        if offset < total_count:
            url = f"https://api.intro.co/experts?TopicId={topic_id}&Offset={offset}&Limit={self.limit}"
            yield SeleniumRequest(url=url, callback=self.parse, meta={'topic_id': topic_id, 'offset': offset})
        else:
            self.logger.info(f"Total experts found: {total_count}")


