import { Kafka, Producer, logLevel } from 'kafkajs';

// Địa chỉ Kafka Broker đang chạy dưới Docker của bạn

const saslUsername = process.env.KAFKA_SASL_USERNAME;
const saslPassword = process.env.KAFKA_SASL_PASSWORD;
const globalForKafka = global as unknown as { kafka: Kafka; producer: Producer };

export const kafka =
    globalForKafka.kafka ||
    new Kafka({
        clientId: 'fruit-shop-kafka',
        brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
        logLevel: logLevel.ERROR, // Chỉ hiện log khi có lỗi lớn
        sasl: {
            mechanism: 'scram-sha-256', // hoặc 'SCRAM-SHA-256' nếu dùng scram
            username: saslUsername || '',
            password: saslPassword || ''
        },
        ssl: false // Tắt SSL nếu broker không yêu cầu (như trong docker-compose của bạn)
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