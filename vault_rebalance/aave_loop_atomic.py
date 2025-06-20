from time import sleep

from dotenv import load_dotenv
from web3 import HTTPProvider, Web3
from web3.types import RPCEndpoint
import os

load_dotenv()
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
COMPASS_API_KEY = os.getenv("COMPASS_API_KEY")

w3 = Web3(HTTPProvider("http://127.0.0.1:8545")) #ETHEREUM


# Get account
WALLET = "0xa829B388A3DF7f581cE957a95edbe419dd146d1B"

w3.provider.make_request(RPCEndpoint("anvil_impersonateAccount"), [WALLET])

w3.provider.make_request(
    RPCEndpoint("anvil_setBalance"),
    [WALLET, "0x56BC75E2D63100000"],  # Equivalent to 100 ETH in wei
)



from compass_api_sdk import CompassAPI, models


compass = CompassAPI(api_key_auth=COMPASS_API_KEY)


def print_balance() -> float:
    res = compass.token.balance(
            chain=models.TokenBalanceChain.ETHEREUM_MAINNET,
            user=WALLET,
            token=models.TokenEnum.USDC,
            server_url='http://0.0.0.0:80'
        )
    print(f" USDC balance: {res.amount}")
    pass

def print_eth_balance() -> float:
    res = compass.token.balance(
            chain=models.TokenBalanceChain.ETHEREUM_MAINNET,
            user=WALLET,
            token="ETH",
            server_url='http://0.0.0.0:80'
        )
    print(f" ETH balance: {res.amount}")
    pass

def print_vault_position(vault: str) -> dict:
    res = compass.morpho.vault_position(
        chain=models.MorphoVaultPositionChain.ETHEREUM_MAINNET,
        user_address="0xa829B388A3DF7f581cE957a95edbe419dd146d1B",
        vault_address=vault,
        server_url='http://0.0.0.0:80'
    )
    # Handle response
    print(f"vault contains: {res.token_amount} USDC")
    pass


def set_allowance_tx(contract: models.IncreaseAllowanceRequestContractName) -> dict:
    res = compass.universal.allowance_set(
        contract_name=contract,
        amount=1000,
        chain=models.Chain.ETHEREUM_MAINNET,
        token=models.TokenEnum.USDC,
        sender=WALLET,
        #server_url="http://0.0.0.0:80",
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    print(unsigned_transaction)
    return unsigned_transaction

print('here')



print_balance()
print_eth_balance()

print(set_allowance_tx(contract=models.IncreaseAllowanceRequestContractName.UNISWAP_V3_ROUTER))


print('WITHDRAWING ALL USDC FROM MORPHO...')







print_vault_position(usdc_vaults[0])
print_vault_position(usdc_vaults[1])
print_vault_position(usdc_vaults[2])

print(w3.eth.send_transaction(withdraw_tx(usdc_vaults[0])).hex())
sleep(2)
print(w3.eth.send_transaction(withdraw_tx(usdc_vaults[1])).hex())
sleep(2)
print(w3.eth.send_transaction(withdraw_tx(usdc_vaults[2])).hex())
sleep(2)


print_vault_position(usdc_vaults[0])
print_vault_position(usdc_vaults[1])
print_vault_position(usdc_vaults[2])


print('GET USDC BALANCE AGAIN:')

# wait for anvil to mine a block for the USDC balance to update
sleep(2)
print_balance()



print('SET ALLOWANCE ON MORPHO:')


# wait for anvil to mine a block for the USDC balance to update
sleep(2)
# 
# res = compass.morpho.allowance(
#     vault_address=usdc_vaults[0],
#     amount=4,
#     chain=models.MorphoSetVaultAllowanceRequestChain.ETHEREUM_MAINNET,
#     sender=WALLET,
#     server_url='http://0.0.0.0:80'
# )
# unsigned_transaction = res.model_dump(by_alias=True)
# print(unsigned_transaction)





print(w3.eth.send_transaction(set_allowance_tx(usdc_vaults[0])).hex())
sleep(2)
print(w3.eth.send_transaction(set_allowance_tx(usdc_vaults[1])).hex())
sleep(2)
print(w3.eth.send_transaction(set_allowance_tx(usdc_vaults[2])).hex())
sleep(2)


#unsigned_transaction['nonce'] = 200
# txn_hash = w3.eth.send_transaction(unsigned_transaction)
# print(txn_hash.hex())





print('DEPOSIT ALL USDC INTO THIS VAULT:')

# wait for anvil to mine a block for the USDC balance to update
sleep(2)

total = 8.53

print(w3.eth.send_transaction(deposit_tx(vault=usdc_vaults[0], amount= total*0.33)).hex())
sleep(2)
print(w3.eth.send_transaction(deposit_tx(vault=usdc_vaults[1], amount=total*0.33)).hex())
sleep(2)
print(w3.eth.send_transaction(deposit_tx(vault=usdc_vaults[2], amount=total*0.33)).hex())
sleep(2)



print('GET BALANCE AGAIN')
sleep(2)
print_balance()







