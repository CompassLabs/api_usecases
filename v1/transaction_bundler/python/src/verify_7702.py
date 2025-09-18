from eth_utils import keccak, to_bytes, to_checksum_address, encode_hex
from eth_abi import encode
from hexbytes import HexBytes
from eth_account import Account

# Constants from EIP-7702
EIP712_DOMAIN_TYPEHASH = keccak(text="EIP712Domain(string name,string version,uint256 chainId)")
SET_CODE_AUTH_TYPEHASH = keccak(text="SetCodeAuthorization(address address,uint256 nonce)")
NAME_HASH = keccak(text="SetCodeAuthorization")
VERSION_HASH = keccak(text="1")

def compute_authorization_hash(chain_id: int, address: str, nonce: int) -> HexBytes:
    # Domain separator
    domain_separator = keccak(encode(
        ["bytes32", "bytes32", "bytes32", "uint256"],
        [EIP712_DOMAIN_TYPEHASH, NAME_HASH, VERSION_HASH, chain_id]
    ))

    # Struct hash
    struct_hash = keccak(encode(
        ["bytes32", "address", "uint256"],
        [SET_CODE_AUTH_TYPEHASH, address, nonce]
    ))

    # Final digest per EIP-712
    digest = keccak(b"\x19\x01" + domain_separator + struct_hash)
    return HexBytes(digest)

def verify_signed_auth(auth: dict) -> bool:
    """
    auth dict should contain:
      chainId, address, nonce, r, s, y_parity
    """
    # 1. Compute hash
    auth_hash = compute_authorization_hash(auth["chainId"], auth["address"], auth["nonce"])

    # 2. Build v
    v = 27 + int(auth["yParity"])
    r = int(auth["r"], 16) if isinstance(auth["r"], str) else auth["r"]
    s = int(auth["s"], 16) if isinstance(auth["s"], str) else auth["s"]

    # 3. Recover signer
    recovered = Account._recover_hash(auth_hash, vrs=(v, r, s))

    # 4. Compare
    claimed = to_checksum_address(auth["address"])
    return recovered == claimed
# Example
ok = verify_signed_auth({'chainId': 8453, 'address': '0xCf1bf4a8b5C842964E2099A4b9237b49fB7691f5', 'nonce': 42, 'yParity': 1, 'r': 40177708568180131533826979318090438329579008828474395660138633040221264488371, 's': 35287679540338269959274607951056073860510649160836574417114069478585178191135},
    )
print("Valid:", ok)
