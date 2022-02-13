const fs = require("fs")
const path = require("path")
const ipfsClient = require('ipfs-http-client')
const util = require("util")
const packToStream = require('ipfs-car/pack/stream')
const FsBlockStore = require('ipfs-car/blockstore/fs')
const unpack  = require('ipfs-car/unpack')
const  CarReader = require('@ipld/car')



/*
async function copyImagesTo1155Format(){
  fs.readdir(IMAGES_FOLDER, function (err, files) {
      //handling error
      if (err) {
          return console.log('Unable to scan directory: ' + err);
      } 
      //listing all files using forEach
      let counter = 0;
      let fileName;
      files.forEach(function (file) {
          let paddedHex = ("0000000000000000000000000000000000000000000000000000000000000000" + counter.toString(16)).substr("-64");
        console.log("from: " + ${IMAGES_FOLDER}${file} + " to: " + `${IMAGES_FOLDER_1155}${paddedHex}.jpg`)
        await fs.copyFile(`${IMAGES_FOLDER}${file}`, `${IMAGES_FOLDER_1155}${paddedHex}.jpg`, (err) =>{

        } )
          console.log(file); 
      });
});

}
*/



async function  createMetaData(imagesIFPSAddress, imageFolder, metaDataFolder){
  let i = 1;

 let jsonStr = {
  "id" : 0,
  "name": "",
  "image": "",
  "attributes" :[],
  "description" : ""
}

let traitType = {
  "trait_type": "security_type", 
   "value": "Index"
}

const types = ["Index", "ETH", "Value", "Growth", "Tech"];

fs.readdirSync(imageFolder).forEach(file => {
      fileParts = file.split('.');
      jsonStr.id = i;
      jsonStr.name = fileParts[0];
      console.log(imagesIFPSAddress + imageFolder.substr(1) + file);
      
      traitType.value = types[Math.floor(Math.random()*types.length)]
      jsonStr.attributes = [traitType];

      jsonStr.description = "This is a great discription."
      jsonStr.image ="https://" + imagesIFPSAddress + ".ipfs.dweb.link" + imageFolder.substr(1) + file;
      jsonFileName = String(i);// + ".json";
      let paddedHex = i.toString(16);//("0000000000000000000000000000000000000000000000000000000000000000" + i.toString(16)).substr("-64");
      fs.writeFileSync(`${metaDataFolder}${paddedHex}`, JSON.stringify(jsonStr))
      console.log(file);
      console.log("zzzz" +  metaDataFolder + jsonFileName, JSON.stringify(jsonStr))
      
      ++i;
  });

}

async function createCar(fileFolder, carName, outputFolder){
  let writable = fs.createWriteStream(`${outputFolder}${carName}`)
 
  let result1 = await packToStream.packToStream({
    input: `${fileFolder}`,
    writable,
    blockstore: new FsBlockStore.FsBlockStore()
  });

  const inStream = fs.createReadStream(`${outputFolder}${carName}`)
  const carReader = await CarReader.CarReader.fromIterable(inStream)

  const files = []
  for await (const file of unpack.unpack(carReader)) {
    console.log("debug unpack:" +  util.inspect(file.name))
  }

}


async function uploadCar(ipfs, carFolder){
  let i = 0;
  for await (const file of ipfs.dag.import(ipfsClient.globSource(`${carFolder}`, '*'))) {
    console.log("i=" + i + " " + file)
    console.log("cid=" + file.root.cid)
    return file.root.cid ;
    ++i;
  }
}


async function deleteFileInDirectory(directoryName){  
  fs.readdir(directoryName, (err, files) => {
    if (err) throw err;
    
    for (const file of files) {
        console.log(file + ' : File Deleted Successfully.');
        fs.unlinkSync(directoryName+file);
    }
});
}


async function run() {
  const IMAGES_CAR_FOLDER = './imagesCar/'
  const IMAGES_FOLDER = './images/'
  const CAR_NAME = 'images6.car'
  const META_DATA_FOLDER = './metadata/'
  const META_DATA_CAR_FOLDER = './metadataCar/'
  const CAR_NAME_META_1155 = 'meta.car'

  ipfs = ipfsClient.create(process.argv[2])
  await createCar(IMAGES_FOLDER, CAR_NAME, IMAGES_CAR_FOLDER);
  let cidImage = await uploadCar(ipfs, IMAGES_CAR_FOLDER)

 // await deleteFileInDirectory(META_DATA_FOLDER)
  //return;
  await createMetaData(cidImage, IMAGES_FOLDER , META_DATA_FOLDER);
  await createCar(META_DATA_FOLDER, CAR_NAME_META_1155, META_DATA_CAR_FOLDER);
  let cidMetaData = await uploadCar(ipfs, META_DATA_CAR_FOLDER)

  console.log("images CID: " + cidImage + ", meta data CID: " + cidMetaData)

  console.log("get CID: " + util.inspect(await ipfs.get(cidMetaData)))
  let test2 = await ipfs.get(cidMetaData);
  console.log(util.inspect(test2))
  let i = 0;
  for await (const file of test2) {
    console.log('\r\n' + '\r\n')
    console.log("debug from unpack: " + i + " \r\n" +  (file))
    ++i;
  }
}

run()


