'use strict';

import { ethers } from 'ethers';
import { contractsByNetwork } from './constants';
import { zipObject } from 'lodash';
const globalObject: any = require('the-global-object');
const NFTIteratorArtifact = require('./NFTIterator');

const signer = (
  (globalObject.ethereum && new ethers.providers.Web3Provider(globalObject.ethereum)) ||
  new ethers.providers.JsonRpcProvider(
    'https://mainnet.infura.io/v3/816df2901a454b18b7df259e61f92cd2'
  )
).getSigner();
const factory = new ethers.ContractFactory(
  NFTIteratorArtifact.abi,
  NFTIteratorArtifact.bytecode,
  signer
);

const nft = contractsByNetwork.mainnet.address;

export const getOwnerList = async () => {
  const [list] = ethers.utils.defaultAbiCoder.decode(
    ['address[]'],
    await signer.provider.call({
      data: factory.getDeployTransaction(nft).data
    })
  );
  const owners = zipObject(
    Array(199)
      .fill(0)
      .map((_, i) => i + 1),
    list
  );
  Object.keys(owners).forEach((key) => {
    if (owners[key] === ethers.constants.AddressZero) {
      delete owners[key];
    }
  });
  return owners;
};
