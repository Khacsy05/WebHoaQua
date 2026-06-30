import { Kafka, Producer, logLevel } from 'kafkajs';

// Địa chỉ Kafka Broker đang chạy dưới Docker của bạn
const brokers = ['localhost:9092'];

const globalForKafka = global as unknown as { kafka: Kafka; producer: Producer };

export const kafka =
    globalForKafka.kafka ||
    new Kafka({
        clientId: 'fruit-shop-kafka',
        brokers: brokers,
        logLevel: logLevel.ERROR, // Chỉ hiện log khi có lỗi lớn
    });

export const getKafkaProducer = async (): Promise<Producer> => {
    if (!globalForKafka.producer) {
        globalForKafka.producer = kafka.producer();
        await globalForKafka.producer.connect();
        console.log('⚡ Kafka Producer đã kết nối thành công!');
    }
    return globalForKafka.producer;
};

if (process.env.NODE_ENV !== 'production') {
    globalForKafka.kafka = kafka;
}