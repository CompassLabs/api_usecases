export const handleVaultAmountChange = (
    setVaultRebalanceAmounts: (fn: (prev: { [key: string]: string }) => { [key: string]: string }) => void,
    vaultAddress: string,
    amount: string
) => {
    setVaultRebalanceAmounts((prev) => ({
        ...prev,
        [vaultAddress]: amount,
    }));
}; 