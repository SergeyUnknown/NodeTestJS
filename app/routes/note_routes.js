const Promise = require('bluebird');
const csvtojson = require("csvtojson");
const XLSX = require('xlsx');
function parseExcelToCSV(codeFile){
	var wb = XLSX.read(codeFile, {type:'base64'});
	var ws = wb.Sheets[wb.SheetNames[0]];
	var CSVStr = XLSX.utils.sheet_to_csv(ws);
	CSVStr = CSVStr.toString().replace(/\//g,'.');
	return CSVStr 
};

function parseCSVToJson(decodeFile){
	var Converter = csvtojson.Converter;
	Promise.promisifyAll(Converter.prototype);
	
	var converter = new Converter();
	return converter.fromStringAsync(decodeFile);
}

function filterData(jsonData,primaryFields){
	var keys = Object.keys(jsonData[0]);
	var eqRow = true; 
	
	for(var i =0;i< jsonData.length;i++){
		for(var j=(i+1);j<jsonData.length;j++){
			for(var k in keys){
				if(jsonData[i][keys[k]] != jsonData[j][keys[k]]){
					eqRow = false;
					break;
				}
			}
			if(eqRow){
				jsonData.splice(j,1);
			}
			else{
				eqRow = true;
			}		
		}
	}
	
	for(var i =0;i< jsonData.length;i++){
		var strIds = [];
		for(var j =0;j< primaryFields.length;j++){
			strIds.push(jsonData[0][keys[j]]);
		}
		
		for(var j = i+1;j<jsonData.length;j++){
			var eqIdx = true;
			for(var k =0;k< primaryFields.length;k++){
				if(strIds[k] != jsonData[j][keys[k]]){
					eqIdx = false;
					break;
				}
			}
			if(eqIdx){
				if(new Date(jsonData[i].ed) >= new Date(jsonData[j].ed)){
					jsonData.splice(j,1);
				}
				else
				{
					var tempElem = jsonData[j];
					jsonData[j] = jsonData[j];
					jsonData[i] = tempElem;
					jsonData.splice(j,1);
				}
			}
		}	
	}
	return Promise.resolve(jsonData);
}

function getCSV(req){
	if(req.body.extension.toLowerCase() != 'csv'){
		var codeFile = req.body.file;
		return new Promise(function(resolve,reject){
			resolve(parseExcelToCSV(codeFile));
		});
	}
	else{
		return Promise.resolve(new Buffer(req.body.file,'base64').toString());
	}
}


module.exports = function(app, db) {
    app.post('/', (req, res) => {	
	getCSV(req)
	.then(parseCSVToJson)
	.then((jsonData)=>{
		return filterData(jsonData,req.body.primaryFields);
	})
	.then((filteredJson)=>{
		//console.log(filteredJson);
		res.send(filteredJson);
	})
	.catch((err) =>{
		console.log(err);
	});
  });
  
  app.post('/old/', (req, res) => {
	  var json = req.body;
	  var vals = json.vals;
	  var ids = json.ids;
	  var tempStr = 'ids: ' + json.ids + '\n';
	  tempStr += 'paramCount: ' + vals.length + '\n';
	  var keys = Object.keys(vals[0]);
	  tempStr += 'param names: ' + keys;
	  
	  var eqRow = true;
	  
	  for(var i =0;i< vals.length;i++){
		for(var j=(i+1);j<vals.length;j++){
			for(var k in keys){
				if(vals[i][keys[k]] != vals[j][keys[k]]){
					eqRow = false;
					break;
				}
			}
			if(eqRow){
				vals.splice(j,1);
			}
			else{
				eqRow = true;
			}
				
		}
		
	  }
	  console.log(vals);
	  for(var i =0;i< vals.length;i++){
		var strIds = [];
		for(var j =0;j< ids.length;j++){
			strIds.push(vals[0][keys[j]]);
		}
		
		for(var j = i+1;j<vals.length;j++){
			var eqIdx = true;
			for(var k =0;k< ids.length;k++){
				if(strIds[k] != vals[j][keys[k]]){
					console.log(i+';'+j+'ne');
					eqIdx = false;
					break;
				}
			}
			if(eqIdx){
				if(new Date(vals[i].ed) >= new Date(vals[j].ed)){
					console.log('delete '+j);
					vals.splice(j,1);
				}
				else
				{
					var tempElem = vals[j];
					vals[j] = vals[j];
					vals[i] = tempElem;
					vals.splice(j,1);
				}
			}
			
		}
			
	  }
		  
      res.send(vals);
  });
};