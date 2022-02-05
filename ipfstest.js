const fs = require("fs")
const path = require("path")
const ipfsClient = require('ipfs-http-client')
const util = require("util")
const packToStream = require('ipfs-car/pack/stream')
const FsBlockStore = require('ipfs-car/blockstore/fs')

const IMAGES_CAR_FOLDER = './imagesCar'
const IMAGES_FOLDER = './images'
const CAR_NAME = 'images5.car'


async function createCar(){
  let writable = fs.createWriteStream(`${IMAGES_CAR_FOLDER}/${CAR_NAME}`)
  await packToStream.packToStream({
    input: `${IMAGES_FOLDER}`,
    writable,
    blockstore: new FsBlockStore.FsBlockStore()
  });
}

async function getAll(ipfs){
  for await (const file of ipfs.dag.import(ipfsClient.globSource(`${IMAGES_CAR_FOLDER}`, '*'))) {
    console.log(file)
  }
}

async function run() {
  ipfs = ipfsClient.create(process.argv[2])
  await createCar();
  await getAll(ipfs)
}

run()

