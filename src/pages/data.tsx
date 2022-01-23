/* eslint-disable no-console */
import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { contractsByNetwork, SupportedNetwork } from 'util/constants';
import { getOwnerList } from 'util/get-owner-list';
import { useAccount, useNetwork } from 'wagmi';
import { mapValues } from 'lodash';
import { ethers } from 'ethers';
import base64url from 'base64url';
import {
  Center,
  Container,
  Flex,
  Heading,
  HStack,
  Spacer,
  VStack,
} from '@chakra-ui/react';
import { Layout } from 'components/layout';
const cryptico = require('cryptico-js');
const crypto = require('libp2p-crypto');
const NFTPINNER_ADDRESS = '0x38a024C0b412B9d1db8BC398140D00F5Af3093D4';
const ATXDAONFT_ADDRESS = '0x63f8F23ce0f3648097447622209E95A391c44b00';
let nftPinner: any;
let nft: any;

if (nft) console.log('');
	
//const ln = (v: any) => (console.log(v), v);

// eslint-disable-next-line @typescript-eslint/no-var-requires

let signer: any;

//const toObjectBase64 = (o: any) => mapValues(o, (v: any) => base64url(Buffer.from(v, 'hex')));

const mapToBuffers = (o: any) => mapValues(o, (v: any) => base64url(v.toByteArray && Buffer.from(v.toByteArray()) || Buffer.from(ethers.utils.hexlify(v).substr(2), 'hex')));

const EventPage: NextPage = () => {
  const account = useAccount();
  const [{ data: accountData }] = account;
  const [{ data: networkData }] = useNetwork();
  const [ hasNft, setHasNft ] = useState(0);
  const [ publicKey, setPublicKey ] = useState(null);
  const networkName = ('mainnet' || networkData.chain?.name || 'mainnet').toLowerCase();
  console.log(networkData);
  const [keypair, setKeyPair] = useState(null);
  useEffect(() => {
    signer = new ethers.providers.Web3Provider(
      window.ethereum as any
    ).getSigner();
    nftPinner = new (ethers.Contract as any)(NFTPINNER_ADDRESS, [ 'function setPublicKey(uint256, string)' ], (window.ethereum as any) && new ethers.providers.Web3Provider((window.ethereum as any)).getSigner() || new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/816df2901a454b18b7df259e61f92cd2'));
    nft = new (ethers.Contract as any)(ATXDAONFT_ADDRESS, [ 'function hasMinted(address) view returns (bool)' ], nftPinner.signer || nftPinner.provider);
  }, []);
  const checkNft = async () => {
    const _hasNft = await getOwnerList();
    const nftId = Number(Object.keys(_hasNft).find((v) => _hasNft[v] === (accountData || {}).address) || 0);
    if (nftId !== 0) setPublicKey(await nftPinner.ipnsPublicKeyForNFT(nftId));
    setHasNft(nftId as any);
  }
  useEffect(() => {
    (async () => {
      await checkNft();
    })().catch(console.error);
  }, [ account ]);
  const sendPublicKey = async (evt: any) => {
    evt.preventDefault();
    const tx = await nftPinner.setPublicKey(hasNft, ((keypair || {}) as any).multiaddr); 
    await tx.wait();
    await checkNft();
  };
  const { address: contractAddress } =
    contractsByNetwork[networkName as SupportedNetwork];
  const computeKey = async () => {
    await (window.ethereum as any).enable();
    const key = mapToBuffers(await cryptico.generateRSAKey(await signer.signMessage('GENERATE IPNS KEY FOR NFT ' + contractAddress + ' ChainId ' + ( await signer.provider.getNetwork()).chainId), 2048));
    key.dp = key.dmp1;
    key.dq = key.dmq1;
    key.qi = key.coeff;
    const rsaKey = new crypto.keys.supportedKeys.rsa.RsaPrivateKey(key, key);
    rsaKey.multiaddr = await rsaKey.id();
    setKeyPair(rsaKey);
  };
  const [owners] = useState([
    {
      address: '0x6d7ddd863eb2dad990bc05bdd3357e32850509e9',
      pfpId: 29,
    },
    {
      address: '0x723960d9a5c6ab71853059861d1c6146770a6dc1',
      pfpId: 28,
    },
  ]);

  return (
    <Layout title="atxdao" connected={!!accountData} canToggleHeader>
      <Container width="100%" height="100%">
        <VStack spacing={10}>
          <Heading fontSize="4rem">NFT data for holder</Heading>
          <Flex height="55vh">
            <Center>
              <HStack
                spacing={12}
                overflowX="hidden"
                alignItems="left"
                textAlign="left"
              >
                {owners.map((owner) => {
                  const { address, pfpId } = owner;
                  return <span key={`${address}-${pfpId}`} {...owner} />;
                })}
              </HStack>
            </Center>
          </Flex>
          <HStack spacing={12}>
            <button onClick={(evt) => { evt.preventDefault(); computeKey().catch(console.error) }}>Compute Key</button>
            <div>IPNS Key: {((keypair as any) || {}).multiaddr || ''} </div>
            { keypair && !publicKey && <button onClick={ sendPublicKey }>Register Public Key</button> }
            <Spacer />
          </HStack>
        </VStack>
      </Container>
    </Layout>
  );
};

export default EventPage;
