#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Env, Map, String, Vec};

#[contracttype]
#[derive(Clone)]
enum DataKey {
	Admin,
	TotalPool,
	ContributorCount,
	Contributors,
	Contributions,
	LastPayouts,
}

#[contracttype]
#[derive(Clone, PartialEq, Eq)]
pub struct PayoutRecord {
	pub user: String,
	pub amount: u32,
}

#[contract]
pub struct IsdaSureContract;

impl IsdaSureContract {
	fn admin(env: &Env) -> String {
		env.storage()
			.instance()
			.get(&DataKey::Admin)
			.unwrap_or(String::from_str(env, "admin"))
	}

	fn total_pool(env: &Env) -> u32 {
		env.storage().instance().get(&DataKey::TotalPool).unwrap_or(0)
	}

	fn contributor_count(env: &Env) -> u32 {
		env.storage()
			.instance()
			.get(&DataKey::ContributorCount)
			.unwrap_or(0)
	}

	fn contributors(env: &Env) -> Vec<String> {
		env.storage()
			.instance()
			.get(&DataKey::Contributors)
			.unwrap_or(Vec::new(env))
	}

	fn contributions(env: &Env) -> Map<String, u32> {
		env.storage()
			.instance()
			.get(&DataKey::Contributions)
			.unwrap_or(Map::new(env))
	}

	fn store_state(
		env: &Env,
		total_pool: u32,
		contributor_count: u32,
		contributors: &Vec<String>,
		contributions: &Map<String, u32>,
	) {
		env.storage().instance().set(&DataKey::TotalPool, &total_pool);
		env.storage()
			.instance()
			.set(&DataKey::ContributorCount, &contributor_count);
		env.storage()
			.instance()
			.set(&DataKey::Contributors, contributors);
		env.storage()
			.instance()
			.set(&DataKey::Contributions, contributions);
	}

	fn build_payouts(
		env: &Env,
		total_pool: u32,
		contributor_count: u32,
		contributors: Vec<String>,
	) -> Vec<PayoutRecord> {
		let mut payouts = Vec::new(env);

		if contributor_count == 0 || total_pool == 0 {
			return payouts;
		}

		let payout_amount = total_pool / contributor_count;

		for user in contributors.iter() {
			payouts.push_back(PayoutRecord {
				user,
				amount: payout_amount,
			});
		}

		payouts
	}
}

#[contractimpl]
impl IsdaSureContract {
	pub fn contribute(env: Env, user: String, amount: u32) -> u32 {
		assert!(amount > 0, "contribution must be greater than zero");

		let mut total_pool = Self::total_pool(&env);
		let mut contributor_count = Self::contributor_count(&env);
		let mut contributors = Self::contributors(&env);
		let mut contributions = Self::contributions(&env);
		let mut is_new_contributor = true;

		for existing_user in contributors.iter() {
			if existing_user == user {
				is_new_contributor = false;
				break;
			}
		}

		if is_new_contributor {
			contributors.push_back(user.clone());
			contributor_count = contributor_count.saturating_add(1);
		}

		let existing_amount = contributions.get(user.clone()).unwrap_or(0);
		contributions.set(user.clone(), existing_amount.saturating_add(amount));
		total_pool = total_pool.saturating_add(amount);

		Self::store_state(&env, total_pool, contributor_count, &contributors, &contributions);
		total_pool
	}

	pub fn trigger_storm(env: Env, admin: String) -> Vec<PayoutRecord> {
		assert!(admin == Self::admin(&env), "unauthorized admin");

		let contributors = Self::contributors(&env);
		let total_pool = Self::total_pool(&env);
		let contributor_count = Self::contributor_count(&env);
		let payouts = Self::build_payouts(&env, total_pool, contributor_count, contributors);

		env.storage().instance().set(&DataKey::LastPayouts, &payouts);
		env.storage().instance().set(&DataKey::TotalPool, &0u32);

		payouts
	}

	pub fn distribute(env: Env) -> Vec<PayoutRecord> {
		let contributors = Self::contributors(&env);
		let total_pool = Self::total_pool(&env);
		let contributor_count = Self::contributor_count(&env);

		Self::build_payouts(&env, total_pool, contributor_count, contributors)
	}
}

#[cfg(test)]
mod test;
