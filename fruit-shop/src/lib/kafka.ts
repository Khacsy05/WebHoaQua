import { Kafka, Producer, logLevel } from 'kafkajs';

// Địa chỉ Kafka Broker đang chạy dưới Docker của bạn

const saslUsername = process.env.KAFKA_SASL_USERNAME;
const saslPassword = process.env.KAFKA_SASL_PASSWORD;
const brokerList = [process.env.KAFKA_BROKERS || 'localhost:9092'];

// Kiểm tra xem có đang dùng broker local không (local không cần SASL)
const isLocal = brokerList.some(b => b.includes('localhost') || b.includes('kafka:29092') || b.includes('127.0.0.1'));

const saslConfig = (!isLocal && saslUsername && saslPassword) ? {
    mechanism: 'scram-sha-256' as const,
    username: saslUsername,
    password: saslPassword
} : undefined;

const globalForKafka = global as unknown as { kafka: Kafka; producer: Producer };

export const kafka =
    globalForKafka.kafka ||
    new Kafka({
        clientId: 'fruit-shop-kafka',
        brokers: brokerList,
        logLevel: logLevel.ERROR, // Chỉ hiện log khi có lỗi lớn
        sasl: saslConfig,
        ssl: !isLocal && saslConfig ? { rejectUnauthorized: false } : false
    });

export const getKafkaProducer = async (): Promise<Producer> => {
    if (!globalForKafka.producer) {
        globalForKafka.producer = kafka.producer();
    }
    try {
        await globalForKafka.producer.connect();
    } catch (error) {
        console.warn('⚠️ Kafka Producer mất kết nối, đang thử kết nối lại...', error);
        globalForKafka.producer = kafka.producer();
        await globalForKafka.producer.connect();
    }
    return globalForKafka.producer;
};

if (process.env.NODE_ENV !== 'production') {
    globalForKafka.kafka = kafka;
}