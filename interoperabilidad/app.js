const http = require("http");
const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const server = http.createServer(app);
const usersIOP = require('./users.json');
const sectors = require('./sectors.json');
const registry = require('./registry.json');
const request = require('request')
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

const URL_BACKEND = 'http://localhost:8054/gde-restfull-api-web';



app.get('/enviroment',(req,res) => {
	res.json(['APN','ANSES','AFIP','NS']);
});

app.get('/users/:enviroment', (req,res) => {
	let response = usersIOP.filter(elem => elem.cargo === req.params.enviroment);
	res.json(response);
});

app.get('/reparticiones/:enviroment',(req,res) => {
	res.json(['REPANSES','REPNS','REPAFIP']);
});

app.get('/sectors/:enviroment/:reparticion',(req,res) => {
	res.json(sectors.filter(elem => elem.codigoReparticion === req.params.enviroment));
});

app.post("/receive", (req,res) =>{
	let body = req.body;
	let response = {};
	console.log('received -> ', body);
	console.log('==============================================');
	console.log('==============================================');
	console.log('==============================================');
	copyProperties(body,response).then(() =>{
		console.log("RESPONSE -> ", response[response.jsonableObject]);
		let receiver = registry.filter(elem => elem.modulo === response.modulo 
				&& elem.ecosistema === response.ecosistemaDestino)[0];
		let options = {
  			method: 'post',
  			body: response[response.jsonableObject],
  			json: true,
  			url: receiver.url
  		};
  		request(options, (err, res, body) => {
  			if(err){
  				console.log(err);
  			}
  		});
  	});
  	res.end();
});

app.get('/historial/expediente/:anio/:numero/:ecosistema', (req,res) =>{
	let uri = 'http://localhost:8054/gde-restfull-api-web/interoperabilidad/expediente/'+
				req.params.anio+'/'+req.params.numero+'/'+req.params.ecosistema+'/historial'
	http.get(uri,response =>{
		let json = '';
		response.on('data', data => json += data);
		response.on('end', _ =>{
			let history = toJson(json);
			var order = history.length + 1;
			let newHistory = history.map(elem =>{
				let newElement = {};
				Object.keys(elem).forEach( property => {
					if( typeof elem[property.toString()] === 'string' && property.toString() === 'motivo'){
						newElement[property] = elem[property] + 'NUEVOECOSISTEMA';
					}else if (!elem[property]){
						newElement[property.toString()] = null;
					}else{
						newElement[property.toString()] = elem[property];
					}
				});
			newElement.ordenHistorico = order;
			order++;
			return newElement;	
			});
			res.json(history.concat(newHistory));
		});
	});
});


const copyPropertiesWithURL = (body,response) => {
	return Promise.all(Object.keys(body).map( property => {
			if(body[property] && body[property].constructor === Array){
				return getContentFromList(body[property],response,property);
			}else{
				return getContent(response,property,body);
			}
	}));
}

const copyProperties = (body,response) => {
	let objWithUrls = undefined;
	let prop = undefined;
	Object.keys(body).forEach( property => {
		if( !body[property]  || typeof body[property] === 'string'){
			response[property] = body[property];
		}else{
			objWithUrls = body[property];
			prop = property;
			response[property.toString()] = {};
			response.jsonableObject = property.toString();
		}
	});
	return copyPropertiesWithURL(objWithUrls,response[prop]);
}


function getContent(response,property,body){
	if(!body[property]){
		return Promise.resolve();
	}
	return new Promise((resolve,reject) => {
		http.get(body[property], res => {
			let json = '';
			res.on('data', data => json += data );
			res.on('end', _ => { 
			 	response[property.toString()] = toJson(json);
			 	resolve(response);
			});
		});
	});
}

function getContentFromList(arrayOfProperties,response,property){
	response[property.toString()] = [];
	return Promise.all( arrayOfProperties.map((elem,index) => {
				return new Promise ((resolve,reject) => {
					if(!elem){
						resolve();
					}
					http.get(elem, res =>{
					let json = '';
					res.on('data', data => { json += data });
			 		res.on('end', _ => {
			 			response[property.toString()].push(toJson(json));
			 			resolve(response);
			 		});
				});
			});
	}));
}



function toJson(str){
	try{
		return JSON.parse(str);
	}catch(e){}
	return str;
}



let test = { destino: 'destino',
  ecosistemaOrigen: 'ecosistemaorigen', // dato en el expediente
  ecosistemaDestino: 'ecosistemadestino',
  pasePropietario: false, // dato en el expediente
  expedienteInteroperable:{
     expediente: 'http://localhost:8054/gde-restfull-api-web/interoperabilidad/expediente/2017/112908/APN',
     trata: 'http://localhost:8054/gde-restfull-api-web/interoperabilidad/expediente/2017/112908/APN/trata',
     task:'http://localhost:8054/gde-restfull-api-web/interoperabilidad/solicitud.98290113/task', 
     documentos:
      [ 'http://localhost:8054/gde-restfull-api-web/interoperabilidad/expediente/2017/112908/APN/documento/IF-2017-00112909-APN-MARI',
        'http://localhost:8054/gde-restfull-api-web/interoperabilidad/expediente/2017/112908/APN/documento/IF-2017-00099520-APN-MARI',
        'http://localhost:8054/gde-restfull-api-web/interoperabilidad/expediente/2017/112908/APN/documento/PV-2017-00126549-APN-MARI',
        'http://localhost:8054/gde-restfull-api-web/interoperabilidad/expediente/2017/112908/APN/documento/PV-2017-00129486-APN-PRUEBASEE' ],
     historial: 'http://localhost:8054/gde-restfull-api-web/interoperabilidad/expediente/2017/112908/APN/historial',
     archivosDeTrabajo:
      [ 'http://localhost:8054/gde-restfull-api-web/interoperabilidad/expediente/2017/112908/APN/rest.txt/archivoDeTrabajo',
        'http://localhost:8054/gde-restfull-api-web/interoperabilidad/expediente/2017/112908/APN/ABATE.png/archivoDeTrabajo' ]
     } 
   }



// It receives a Json of URI's and return a JSON with the result of all invocations //
/*
let res = {};
copyProperties(test,res).then( _ =>{
	console.log("ENTRADA ->");
	console.log(test);
	console.log("RESULTADO -> ");
	console.log(res);
	console.log("<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>><");
	console.log(res.expedienteInteroperable.task.variables_);
	//console.log(res.expedienteInteroperable.historial);
});*/

server.listen(5000,_ => console.log("Server is listening on Port:5000"));
