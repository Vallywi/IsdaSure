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
