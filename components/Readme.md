Any token account can hold a token
A user account can own the token account
however... to use the same one for a wallet//token combo, we want to deterministically come up with an address. use `create_associated_token_account` for this.

# Realm

Governance

Governance:

- lets you create new "stuff", like DAOs. You can create many DAOs.
- does not use the term DAO, because it is not all encompassing.
- Realm is used to describe this governance

Realm

- has Mints, the voting power, called communityMint
- the community mint is sometimes the realm mint (same thing @helena go refactor)
- realm mint = community mint = governance mint = dao mint

Listing Mint (or App Mint)

- TODO: refactor to call listing mint everywhere

Listing

- listing is a wrapper around the listing mint, including data like price and owner

The program does all the logic. This is on chain. Code is in rust code.

---
