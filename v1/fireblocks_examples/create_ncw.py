import requests

url = "https://api.fireblocks.io/v1/ncw/wallets"

headers = {"accept": "application/json"}

response = requests.post(url, headers=headers)

print(response.text)
