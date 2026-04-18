#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Env};

#[contracttype]
#[derive(Clone)]
enum DataKey {
	Counter,
}

#[contract]
pub struct IsdaSureContract;

#[contractimpl]
impl IsdaSureContract {
	pub fn increment(env: Env, amount: u32) -> u32 {
		let key = DataKey::Counter;
		let current: u32 = env.storage().instance().get(&key).unwrap_or(0);
		let updated = current.saturating_add(amount);

		env.storage().instance().set(&key, &updated);

		updated
	}

	pub fn get_count(env: Env) -> u32 {
		env.storage().instance().get(&DataKey::Counter).unwrap_or(0)
	}

	pub fn reset(env: Env) {
		env.storage().instance().remove(&DataKey::Counter);
	}
}

#[cfg(test)]
mod test;
