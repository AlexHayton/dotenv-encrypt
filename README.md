# dotenv-encrypt-kms

Does your team have a magic .env file they are passing around for local development? Do you keep your deployment secrets in a different place than your code, do you find it hard to track what changed, when? This is the solution for you!

Encrypt your (dev or production) secrets and safely commit them directly into your repo.

## Still to do

- [ ] Write a header comment that we can use to automatically infer the encryption algorithm and key ID
- [ ] Monorepo (standardise the parsing / file writing logic)
- [ ] dotenv-encrypt-password => Takes a password for encrypt/decrypt
- [ ] dotenv-encrypt-pem => Use a PEM file to encrypt/decrypt
- [ ] dotenv-encrypt-hashicorp-vault => Use a secret from Hashicorp Vault
- [ ] dotenv-encrypt-cloud-kms => Use Google Cloud KMS
- [ ] dotenv-encrypt-key-vault => Use Azure Key Vault

## Usage

### Encrypting your .env file:
The following command will encrypt your .env file and save it to .env.encrypted. 

The keys will be human-readable but the values safely encrypted away. So you can safely commit this file to your github repository.

```
dotenv-encrypt-kms --encrypt --key <KMS Key Id>
```

### Decrypting the .env.encrypted file:
My recommendation would be to run the decryption as a post-install step, so your developers don't 
```
dotenv-encrypt-kms --decrypt --key <KMS Key Id>
```

### Options

| Option          | Description                                                            |
|-----------------|------------------------------------------------------------------------|
| --encryptedFile | Specify the name for the encrypted file (defaults to `.env.encrypted`) |
| --decryptedFile | Specify the name for the decrypted file (defaults to `.env`)           |
| --encrypt       | Encrypt what is in the .env file and save it.                          |
| --decrypt       | Decrypt what is in the .env.encrypted file and save it.                |
