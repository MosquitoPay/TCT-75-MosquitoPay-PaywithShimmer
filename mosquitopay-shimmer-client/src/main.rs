// Copyright 2021 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

use crossbeam::channel::unbounded as unbounded_channel;
use dotenvy::var;
use hex::decode as hex_decode;
use iota_sdk::client::{
    mqtt::{
        BrokerOptions, 
        MqttPayload, 
        Topic,
    },
    Client, 
};
use json::JsonValue;
use log::{
    debug,
    error, 
    info,
    warn,
};
use reqwest::Client as ApiClient;
use serde::{
    Deserialize,
    Serialize,
};
use serde_json::to_string;
use std::{
    str::from_utf8, 
    sync::{
        Arc,
        Mutex,
    },
};
use tapa_trait_serde::IJsonSerializable;

#[derive(Debug, Serialize, IJsonSerializable, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WalletTransaction {
    timestamp: String,
    transaction_id: String,
    transaction_method: String,
    wallet_address: String,
    amount: String,
    tag: String,
    metadata: String,
}

// Connecting to a MQTT broker using raw ip doesn't work with TCP. This is a limitation of rustls.
#[tokio::main]
async fn main() {
    // Init logging
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    // Crossbeam channel thread message
    let (tx_shimmer, rx_shimmer) = unbounded_channel();

    // Set loop delay in every task
    let delay = std::time::Duration::from_secs(1);
    let task_delay = std::time::Duration::from_secs(1);

    // API URL
    let api_url = match var("API_URL") {
        Ok(url) => Arc::new(Mutex::new(url)),
        Err(e) => {
            error!("FAILED TO GET ENV VAR API_URL: {:?}", e);
            std::process::exit(1)
        }
    };

    // API key
    let api_key = match var("API_KEY") {
        Ok(key) => Arc::new(Mutex::new(key)),
        Err(e) => {
            error!("FAILED TO GET ENV VAR API_KEY: {:?}", e);
            std::process::exit(1)
        }
    };

    // Shimmer node
    let shimmer_node = match var("SHIMMER_NODE") {
        Ok(node) => node,
        Err(e) => {
            error!("FAILED TO GET ENV VAR SHIMMER_NODE: {:?}", e);
            std::process::exit(1)
        }
    };

    // Shimmer address
    let shimmer_address = match var("SHIMMER_ADDRESS") {
        Ok(address) => address,
        Err(e) => {
            error!("FAILED TO GET ENV VAR SHIMMER_ADDRESS: {:?}", e);
            std::process::exit(1)
        }
    };

    // Create a Shimmer node client.
    let shimmer_client_builder = match Client::builder()
        .with_node(&shimmer_node) {
            Ok(client_builder) => client_builder,
            Err(e) => {
                error!("FAILED TO BUILD SHIMMER CLIENT: {:?}", e);
                std::process::exit(1)
            },
        };

    // Shimmer node client.
    let shimmer_client = match shimmer_client_builder
        .with_mqtt_broker_options(BrokerOptions::new().use_ws(true))
        .finish()
        .await {
            Ok(cli) => cli,
            Err(e) => {
                error!("FAILED TO CONNECT SHIMMER CLIENT: {:?}", e);
                std::process::exit(1)
            }
        };

    // API client thread sharing
    let api_client = Arc::new(Mutex::new(ApiClient::new()));

    if let Err(error_subscribe) = shimmer_client
        .subscribe(
            [
                // Topic::new("milestone-info/latest").unwrap(),
                // Topic::new("blocks").unwrap(),
                match Topic::new(format!("outputs/unlock/address/{}", shimmer_address.clone())) {
                    Ok(topic) => topic,
                    Err(e) => {
                        error!("FAILED TO CREATE TOPIC TO LISTEN: {:?}", e);
                        std::process::exit(1)
                    },
                },
            ],
            move |event| {
                info!("> TOPIC: {}", event.topic);
                let mut shimmer_wallet_transaction = WalletTransaction {
                    timestamp: String::default(),
                    transaction_id: String::default(),
                    transaction_method: "Shimmer".to_string(),
                    wallet_address: shimmer_address.clone(),
                    amount: "0".to_string(),
                    tag: String::default(),
                    metadata: String::default(),
                };
                match &event.payload {
                    MqttPayload::Json(val) => {
                        match to_string(val) {
                            Ok(json_string) => {
                                match json::parse(&json_string) {
                                    Ok(parsed_val) => {
                                        if let JsonValue::Object(root) = parsed_val {
                                            if let Some(JsonValue::Object(metadata)) = root.get("metadata") {
                                                if let Some(JsonValue::String(transaction_id)) = metadata.get("transactionId") {
                                                    shimmer_wallet_transaction.transaction_id = transaction_id.to_owned();
                                                }
                                                if let Some(JsonValue::Number(timestamp)) = metadata.get("milestoneTimestampBooked") {
                                                    if let Some(milestone_timestamp_booked) = timestamp.as_fixed_point_u64(0) {
                                                        shimmer_wallet_transaction.timestamp = milestone_timestamp_booked.to_string();
                                                    }
                                                }
                                            }
                                            if let Some(JsonValue::Object(output)) = root.get("output") {
                                                if let Some(JsonValue::Short(amount)) = output.get("amount") {
                                                    shimmer_wallet_transaction.amount = amount.to_string();
                                                }
                                                if let Some(JsonValue::Array(features)) = output.get("features") {
                                                    for feature in features.iter() {
                                                        if let JsonValue::Object(feature_data) = feature {
                                                            if let Some(JsonValue::String(tag_data)) = feature_data.get("tag") {
                                                                let the_tagging = tag_data.to_string();
                                                                let tagging = the_tagging.trim_start_matches("0x");
                                                                match hex_decode(tagging) {
                                                                    Ok(hex_tag) => {
                                                                        let the_tag = match from_utf8(&hex_tag) {
                                                                            Ok(val) => val,
                                                                            Err(errror) => {
                                                                                error!("TAGGING DATA ERROR: {:?}", errror);
                                                                                ""
                                                                            }
                                                                        };
                                                                        shimmer_wallet_transaction.tag = the_tag.to_string();
                                                                    },
                                                                    Err(error) => error!("HEX TAGGING DATA ERROR: {:?}", error),
                                                                }
                                                            }
                                                            if let Some(JsonValue::Short(m_data)) = feature_data.get("data") {
                                                                let the_metadataing = m_data.to_string();
                                                                let metadataing = the_metadataing.trim_start_matches("0x");
                                                                match hex_decode(metadataing) {
                                                                    Ok(hex_metadata) => {
                                                                        let the_metadata = match from_utf8(&hex_metadata) {
                                                                            Ok(val) => val,
                                                                            Err(errror) => {
                                                                                error!("METADATA ERROR: {:?}", errror);
                                                                                ""
                                                                            }
                                                                        };
                                                                        shimmer_wallet_transaction.metadata = the_metadata.to_string();
                                                                    },
                                                                    Err(error) => error!("HEX METADATA ERROR: {:?}", error),
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        debug!("WALLET TRANSACTION: {:?}", shimmer_wallet_transaction);
                                    },
                                    Err(e) => error!("JSON PARSE ERROR: {:?}", e),
                                }
                            },
                            Err(err) => error!("JSON STRINGIFY ERROR: {:?}", err),
                        }
                        debug!("JSON: {}", serde_json::to_string(&val).unwrap());
                    },
                    e => error!("UNKNOWN EVENT RECEIVED: {:?}", e),
                }
                // info!("RECEIVED DATA: {:?}", shimmer_wallet_transaction);
                match tx_shimmer.send(shimmer_wallet_transaction) {
                    Ok(_) => debug!("SUCCESS SEND WALLET TX"),
                    Err(err) => error!("SEND WALLET TX ERROR: {:?}", err),
                };
            },
        )
        .await {
            error!("SHIMMER CLIENT SUBSCRIBE ERROR: {:?}", error_subscribe);
            std::process::exit(1);
        };
    
    let _ = {
        let on_shimmer_api_client = Arc::clone(&api_client);
        let on_shimmer_api_url = Arc::clone(&api_url);
        let on_shimmer_api_key = Arc::clone(&api_key);
        tokio::spawn(async move {
            loop {
                tokio::time::sleep(task_delay).await;
                
                let shimmer_api_client = on_shimmer_api_client.lock().unwrap().to_owned();
                let shimmer_api_url = on_shimmer_api_url.lock().unwrap().to_string();
                let shimmer_api_key = on_shimmer_api_key.lock().unwrap().to_string();

                match rx_shimmer.recv() {
                    Ok(shimmer_tx_data) => {
                        info!("RECEIVED: {:?}", shimmer_tx_data);

                        let mut tx_url = shimmer_api_url;
                        tx_url.push_str("/transaction");
                        let response = shimmer_api_client
                            .post(&tx_url)
                            .header("x-cc-api-key", &shimmer_api_key)
                            .header("Content-Type", "application/json")
                            .body(shimmer_tx_data.to_json_string())
                            .send()
                            .await;

                        match response {
                            Ok(resp) => {
                                let resp_code = resp.status().as_u16();
                                match resp.status().as_u16() {
                                    200..=299 => {
                                        match resp.text().await {
                                            Ok(text) => {
                                                info!("RESP TX: {}", text);
                                            },
                                            Err(err) => {
                                                warn!("RESP TX ERROR: {:?}", err);
                                            },
                                        }
                                    },
                                    300..=399 => {
                                        match resp.text().await {
                                            Ok(text) => {
                                                info!("RESP TX {}: {}", resp_code.to_string(), text);
                                            },
                                            Err(err) => {
                                                warn!("RESP TX ERROR: {:?}", err);
                                            },
                                        }
                                    },
                                    400..=599 => {
                                        match resp.text().await {
                                            Ok(text) => {
                                                warn!("RESP TX {} ERROR: {}", resp_code.to_string(), text);
                                            },
                                            Err(err) => {
                                                warn!("RESP TX ERROR: {:?}", err);
                                            },
                                        }
                                    },
                                    _ => {
                                        warn!("RESP TX UNEXPECTED STATUS CODE: {:?}", resp.status());
                                    }
                                }
                            },
                            Err(e) => {
                                warn!("FAILED TO SEND TX: {:?}", e);
                            },
                        }
                    },
                    Err(e) => warn!("RECEIVED ERROR: {:?}", e),
                }
            }
        })
    }
    .await;

    // Main thread looping
    loop {
        tokio::time::sleep(delay).await;
    }
}