# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html


# useful for handling different item types with a single interface
from itemadapter import ItemAdapter
from pymilvus import connections, Collection, FieldSchema, CollectionSchema, MilvusClient, DataType
from sentence_transformers import SentenceTransformer
import logging

class CrawlIntroPipeline:
    def __init__(self, cluster_endpoint, token, collection_name="experts"):
        self.cluster_endpoint = cluster_endpoint
        self.token = token
        self.collection_name = collection_name
        self.client = None
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    @classmethod
    def from_crawler(cls, crawler):
        return cls(
            cluster_endpoint=crawler.settings.get('MILVUS_CLUSTER_ENDPOINT'),
            token=crawler.settings.get('TOKEN'),
            collection_name=crawler.settings.get('MILVUS_COLLECTION_NAME')
        )

    def open_spider(self, spider):
        self.client = MilvusClient(uri=self.cluster_endpoint, token=self.token)
        logging.info(f"Connected to Milvus Cloud at {self.cluster_endpoint}")

        fields = [
            FieldSchema(name="id", dtype=DataType.INT64, is_primary=True),
            FieldSchema(name="intro_id", dtype=DataType.INT64),
            FieldSchema(name = "first_name", dtype = DataType.VARCHAR, max_length = 128),
            FieldSchema(name = "last_name", dtype = DataType.VARCHAR, max_length = 128),
            FieldSchema(name = "avatar", dtype = DataType.VARCHAR, max_length = 512),
            FieldSchema(name="title", dtype=DataType.VARCHAR, max_length=512),
            FieldSchema(name="description", dtype=DataType.VARCHAR, max_length=4096),
            FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=384),  # 向量维度
            FieldSchema(name = 'short_description', dtype = DataType.VARCHAR, max_length = 512),
            FieldSchema(name = 'instagram', dtype = DataType.VARCHAR, max_length = 512),
            FieldSchema(name = 'twitter', dtype = DataType.VARCHAR, max_length = 512),
            FieldSchema(name = 'linkedin', dtype = DataType.VARCHAR, max_length = 512),
            FieldSchema(name = 'youtube', dtype = DataType.VARCHAR, max_length = 512),
            FieldSchema(name = 'tiktok', dtype = DataType.VARCHAR, max_length = 512),
            FieldSchema(name = 'session_price', dtype = DataType.FLOAT),
            FieldSchema(name = 'session_duration', dtype = DataType.FLOAT),
            FieldSchema(name = 'rating', dtype = DataType.FLOAT),
            FieldSchema(name = 'rating_count', dtype = DataType.INT32),
            FieldSchema(name = 'verified', dtype = DataType.BOOL),
            FieldSchema(name = 'url', dtype = DataType.VARCHAR, max_length = 512),
            FieldSchema(name = 'top_expert', dtype = DataType.BOOL),
        ]
        schema = CollectionSchema(fields=fields, description="Expert data with embeddings", auto_id=True)
        index_params = MilvusClient.prepare_index_params()
        index_params.add_index(
            field_name="vector",
            metric_type="COSINE",
            index_type="AUTOINDEX",
            index_name="vector_index"
        )

        # self.client.create_collection(collection_name=self.collection_name, schema=schema)
        # self.client.create_index(collection_name=self.collection_name, index_params=index_params)

        if not self.client.has_collection(self.collection_name):
            self.client.create_collection(collection_name = self.collection_name, schema=schema)
            self.client.create_index(collection_name=self.collection_name, index_params=index_params)
            logging.info(f"Collection '{self.collection_name}' created.")
        else:
            logging.info(f"Collection '{self.collection_name}' already exists.")

    def process_item(self, item, spider):
        description = item.get('description', '')
        vector = self.model.encode(description) if description else []

        data = {
            "intro_id": item['id'],
            "first_name": item['first_name'],
            "last_name": item['last_name'],
            "avatar": item['avatar'],
            "short_description": item['short_description'],
            "title": item['title'],
            "description": description,
            "vector": vector,
            "instagram": item['instagram'],
            "twitter": item['twitter'],
            "linkedin": item['linkedin'],
            "youtube": item['youtube'],
            "tiktok": item['tiktok'],
            "session_price": item['session_price'],
            "session_duration": item['session_duration'],
            "rating": item['rating'],
            "rating_count": item['rating_count'],
            "verified": item['verified'],
            "url": item['url'],
            "top_expert": item['top_expert'],

        }

        self.client.insert(collection_name=self.collection_name, data=[data])
        logging.info(f"Inserted data for expert ID: {item['id']}")

        return item

    def close_spider(self, spider):
        self.client.close()
        logging.info("Connection to Milvus closed.")
