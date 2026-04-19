extern crate std;

use super::*;
use soroban_sdk::{Env, String};
use std::panic::{self, AssertUnwindSafe};

#[test]
fn contribute_updates_pool_and_contributors() {
	let env = Env::default();
	let contract_id = env.register(IsdaSureContract, ());
	let client = IsdaSureContractClient::new(&env, &contract_id);

	let first_user = String::from_str(&env, "User 1");
	let second_user = String::from_str(&env, "User 2");

	assert_eq!(client.contribute(&first_user, &50), 50);
	assert_eq!(client.contribute(&second_user, &50), 100);
	assert_eq!(client.distribute().len(), 2);
}

#[test]
fn trigger_storm_distributes_evenly() {
	let env = Env::default();
	let contract_id = env.register(IsdaSureContract, ());
	let client = IsdaSureContractClient::new(&env, &contract_id);

	let user_one = String::from_str(&env, "User 1");
	let user_two = String::from_str(&env, "User 2");
	let admin = String::from_str(&env, "admin");

	client.contribute(&user_one, &60);
	client.contribute(&user_two, &60);

	let payouts = client.trigger_storm(&admin);

	assert_eq!(payouts.len(), 2);
	assert_eq!(payouts.get(0).unwrap().amount, 60);
	assert_eq!(client.distribute().len(), 0);
}

#[test]
fn repeated_contributions_accumulate() {
	let env = Env::default();
	let contract_id = env.register(IsdaSureContract, ());
	let client = IsdaSureContractClient::new(&env, &contract_id);

	let user = String::from_str(&env, "User 1");

	assert_eq!(client.contribute(&user, &20), 20);
	assert_eq!(client.contribute(&user, &30), 50);
}

#[test]
fn zero_amount_is_rejected() {
	let env = Env::default();
	let contract_id = env.register(IsdaSureContract, ());
	let client = IsdaSureContractClient::new(&env, &contract_id);

	let user = String::from_str(&env, "User 1");
	let result = panic::catch_unwind(AssertUnwindSafe(|| client.contribute(&user, &0)));
	assert!(result.is_err());
}

#[test]
fn unauthorized_admin_is_rejected() {
	let env = Env::default();
	let contract_id = env.register(IsdaSureContract, ());
	let client = IsdaSureContractClient::new(&env, &contract_id);

	let admin = String::from_str(&env, "not-admin");
	let result = panic::catch_unwind(AssertUnwindSafe(|| client.trigger_storm(&admin)));
	assert!(result.is_err());
}
