use super::*;
use soroban_sdk::Env;

#[test]
fn increment_updates_count() {
	let env = Env::default();
	let contract_id = env.register_contract(None, IsdaSureContract);
	let client = IsdaSureContractClient::new(&env, &contract_id);

	assert_eq!(client.get_count(), 0);
	assert_eq!(client.increment(&5), 5);
	assert_eq!(client.get_count(), 5);
}

#[test]
fn reset_clears_count() {
	let env = Env::default();
	let contract_id = env.register_contract(None, IsdaSureContract);
	let client = IsdaSureContractClient::new(&env, &contract_id);

	client.increment(&10);
	client.reset();

	assert_eq!(client.get_count(), 0);
}

#[test]
fn multiple_increments_accumulate() {
	let env = Env::default();
	let contract_id = env.register_contract(None, IsdaSureContract);
	let client = IsdaSureContractClient::new(&env, &contract_id);

	assert_eq!(client.increment(&2), 2);
	assert_eq!(client.increment(&3), 5);
	assert_eq!(client.increment(&4), 9);
	assert_eq!(client.get_count(), 9);
}

#[test]
fn increment_by_zero_keeps_count() {
	let env = Env::default();
	let contract_id = env.register_contract(None, IsdaSureContract);
	let client = IsdaSureContractClient::new(&env, &contract_id);

	client.increment(&7);
	assert_eq!(client.increment(&0), 7);
	assert_eq!(client.get_count(), 7);
}

#[test]
fn increment_saturates_at_u32_max() {
	let env = Env::default();
	let contract_id = env.register_contract(None, IsdaSureContract);
	let client = IsdaSureContractClient::new(&env, &contract_id);

	let max = u32::MAX;
	assert_eq!(client.increment(&max), max);
	assert_eq!(client.increment(&1), max);
	assert_eq!(client.get_count(), max);
}
