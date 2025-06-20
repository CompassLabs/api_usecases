from time import sleep

from dotenv import load_dotenv
from web3 import HTTPProvider, Web3
from web3.types import RPCEndpoint

#load_dotenv()
w3 = Web3(HTTPProvider("http://127.0.0.1:8545")) #ETHEREUM


# Get account
WALLET = "0xa829B388A3DF7f581cE957a95edbe419dd146d1B"

w3.provider.make_request(RPCEndpoint("anvil_impersonateAccount"), [WALLET])

w3.provider.make_request(
    RPCEndpoint("anvil_setBalance"),
    [WALLET, "0x56BC75E2D63100000"],  # Equivalent to 100 ETH in wei
)

k = 'Zp69nDSOYw9P02FiVnhZBaJkvkRcz0Pg1U7cjnhr'


from compass_api_sdk import CompassAPI, models


compass = CompassAPI(api_key_auth=k)

usdc_vaults = [
    "0x341193ED21711472e71aECa4A942123452bd0ddA",  # Re7 USDC Core
    "0x4F460bb11cf958606C69A963B4A17f9DaEEea8b6",  # f(x) Protocol Re7 USDC
    "0x64964E162Aa18d32f91eA5B24a09529f811AEB8e", # Re7, USDC Prime
]

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

def withdraw_tx(vault: str) -> dict:
    res = compass.morpho.withdraw(
        vault_address=vault,
        amount='ALL',
        chain=models.MorphoWithdrawRequestChain.ETHEREUM_MAINNET,
        sender=WALLET,
        server_url='http://0.0.0.0:80'
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    print(unsigned_transaction)
    return unsigned_transaction


def set_allowance_tx(vault: str) -> dict:
    res = compass.morpho.allowance(
        vault_address=vault,
        amount=1000,
        chain=models.MorphoSetVaultAllowanceRequestChain.ETHEREUM_MAINNET,
        sender=WALLET,
        server_url="http://0.0.0.0:80",
    )
    unsigned_transaction = res.model_dump(by_alias=True)
    print(unsigned_transaction)
    return unsigned_transaction

def deposit_tx(vault: str, amount: float) -> dict:
    res = compass.morpho.deposit(
        vault_address=vault,#'0xa0E430870c4604CcfC7B38Ca7845B1FF653D0ff1',
        amount=amount,
        chain=models.MorphoDepositRequestChain.ETHEREUM_MAINNET,
        sender=WALLET,
        server_url='http://0.0.0.0:80'
    )

    unsigned_transaction = res.model_dump(by_alias=True)
    print(unsigned_transaction)
    return unsigned_transaction


print_balance()
print_eth_balance()

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







