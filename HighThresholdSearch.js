//SP search API property restriction enumerations
var propertyRestrictions = {
    "equalorindividualterms": "{0}:{1}",
    "equal": "{0}={1}",
    "lessthan": "{0}<{1}",
    "greaterthan": "{0}>{1}",
    "lessthanequal": "{0}<={1}",
    "greaterthanequal": "{0}>={1}",
    "notequal": "{0}<>{1}",
    "withinrange": "{0}..{1}"
};

//logical operators enumeration used in where clause.
var queryLogicalOperators = {
    "AND": "{0} AND {1}",
    "OR": "{0} OR {1}"
};

//Join type enmeration used in code internally
var joinKind = {
	"NONE":"NONE",
	"INNER":"INNER",
	"LEFTOUTER":"LEFTOUTER",
	"RIGHTOUTER":"RIGHTOUTER",
	"FULLOUTER":"FULLOUTER"
};

//Query type enumeration used in the code internally.
var queryType = {
	"POSTRESTSEARCHQUERY":"POSTRESTSEARCHQUERY",
	"GETRESTSEARCHQUERY":"GETRESTSEARCHQUERY",
	"GETRESTLISTQUERY":"GETRESTLISTQUERY",
	"POSTRESTLISTQUERY":"POSTRESTLISTQUERY",
	"CAMLQUERY":"CAMLQUERY"
};

//POST verb body specific to SP search API
var postSearchQueryRequest = {
    request: {
        Querytext: '',
        StartRow: '0',
        RowLimit: '500',
        RowsPerPage: '500',
        TrimDuplicates: false,
        SelectProperties: { results: [] },
        SortList: { results: [] }
    }
};

//This method is string.format for javascript similar to what we have in C#.
if (!String.format) {
    String.format = function (format) {
        var args = Array.prototype.slice.call(arguments, 1);
        return format.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

//This method wraps a string in single quotes
if (!String.addQuotes) {
    String.addQuotes = function (str) {
        return '"' + str.replace(/"/g, '') + '"';
    };
}

//This class represents search/list API/CAML API interface for the web client.
function QueryRunner() {
    var self = this;
    self.SPSiteUrl = "http://sp2013dev/sites/contosoeix";
    self.SearchUrl = "";
    self.QueryData = "";
    self.QueryType = "REST";
    self.CamlViewXml = "";
    self.PostSearchApiPath = "/_api/search/postquery";
    self.GetSearchApiPath = "/_api/search/query";
    self.ListsRestApiPath = "/_api/web/lists/";
    self.RestQuery = "";
	
    self.QueryText = '{0} AND Path:{1}';
    self.ResultSourceId = "";
    self.QueryPath = "";
    self.PropertyRestrictions = '{0}';

    self.SortFields = [];
    self.SelectProperties = [];

    self.Refiners = "";
    self.RefinementFilters = [];

    self.RankingModelId = "";
    self.StartRow = '0';
    self.RowLimit = '500';
    self.RowsPerPage = '500';

    self.EnableStemming = "false";
    self.EnablePhonetic = "false";
    self.EnableFQL = "false";
    self.TrimDuplicates = false;

    self.EnableQueryRules = "false";
    self.RequestMethod = "POST";
    self.RequestContentType = "application/json;odata=verbose";
    self.RequestHeaders = {
        "accept": "application/json;odata=verbose",
        "X-RequestDigest": $('#__REQUESTDIGEST').val(),
        "X-HTTP-Method": "POST",
        "content-type": "application/json;odata=verbose",
        "If-Match": "*"
    };

	//This method build query string parameter for GET verb specific to SP list API and SP search API
    self.BuildGetSearchQuery = function () {
        if (self.QueryType == queryType.GETRESTLISTQUERY) {
            self.SearchUrl = self.SPSiteUrl + self.RestApiPath + self.RestQuery;
        }
        else {
            var queryExpr = "sourceid='" + self.SourceId + "'";
            queryExpr += "&querytext='" + self.QueryText + "'";
            queryExpr += "&selectproperties='" + self.SelectProperties + "'";
            queryExpr += "&startrow='" + self.StartRow + "'";
            queryExpr += "&rowlimit='" + self.RowLimit + "'";
            self.SearchUrl = self.SPSiteUrl + self.GetSearchApiPath + "?" + queryExpr;
        }
    };

	//This method builds POST verb body specific to SP search restful API and CAML API
    self.BuildPostSearchQuery = function () {
        var query = '';
        if (self.QueryType == queryType.POSTRESTSEARCHQUERY) {
            self.QueryText = String.format(self.QueryText, self.PropertyRestrictions, self.SPSiteUrl + self.QueryPath);
            postSearchQueryRequest.request.Querytext = self.QueryText;
            postSearchQueryRequest.request.SelectProperties.results = self.SelectProperties;
            postSearchQueryRequest.request.SortList.results = self.SortFields;
            postSearchQueryRequest.request.StartRow = self.StartRow;
			
			if(postSearchQueryRequest.request.Querytext.startsWith(' AND ') === true)
			{
				postSearchQueryRequest.request.Querytext = postSearchQueryRequest.request.Querytext.replace(' AND ','');
			}
			
            query = postSearchQueryRequest;
        }
        else {
            camlQueryRequest.query.ViewXml = self.CamlViewXml;
            query = camlQueryRequest;
        }

        return JSON.stringify(query);
    };

	//This method calls supporting method to build restful queries for SP list API, SP search API and SP CAML API and run those queries.
    self.Search = function (crossDomain, deferredObject) {
        var queryParams = "";
        var SearchUrl = "";

        if (self.QueryType == queryType.POSTRESTSEARCHQUERY) {
            self.QueryData = self.BuildPostSearchQuery();
            self.RequestHeaders["content-length"] = self.QueryData.length;
            self.SearchUrl = self.SPSiteUrl + self.PostSearchApiPath;
        }
        else if (self.QueryType == queryType.GETRESTSEARCHQUERY) {
            self.BuildGetQuery();
        }
        else if (self.QueryType == queryType.CAMLQUERY) {
            self.QueryData = self.BuildPostSearchQuery();
            self.RequestHeaders["content-length"] = self.QueryData.length;
            self.SearchUrl = self.SPSiteUrl + self.QueryPath;
        }
        else if (self.QueryType == queryType.GETRESTLISTQUERY) {
            self.BuildGetQuery();
        }

        self.RunSearch(crossDomain, deferredObject);
    };

	//This method fires AJAX requests to server.
    self.RunSearch = function (isCrossDomain, deferredObject) {
        if (isCrossDomain === false) {
            $.ajax(
			{
			    url: self.SearchUrl,
			    type: self.RequestMethod,
			    headers: self.RequestHeaders,
			    data: self.QueryData,
			    success: function (data) { deferredObject.resolve(data); },
			    error: function (data) { deferredObject.reject(data); }
			});
        } //Add else block to use SP.RequestExecutor to fire cross domain query
    };
}

function Query()
{
	var self = this;
	
	//This method executes a complex SQL like query using SP search terminologies.
	self.RunComplexQuery = function(joinType, leftSideListName,leftSideJoinListPath, leftSideJoinField, rightSideListName,rightSideJoinListPath, rightSideJoinField, leftListWhereClauseFields, rightListWhereClauseFields, leftListSelectFields, rightListSelectFields, pageNumber)
	{
		var queryRunnerObj1 = null;
		var queryRunnerObj2 = null;
		var d1 = null;
        var d2 = null;
		var joinedResult = null;
		
		if(joinType === joinKind.INNER)
		{
			queryRunnerObj1 = new QueryRunner();
			queryRunnerObj2 = new QueryRunner();
			d1 = new $.Deferred();
			d2 = new $.Deferred();
			
			queryRunnerObj1.QueryPath = leftSideJoinListPath;
			queryRunnerObj1.QueryType = queryType.POSTRESTSEARCHQUERY;
			queryRunnerObj1.PropertyRestrictions = String.format(queryRunnerObj1.PropertyRestrictions, self.GetPropertyRestrictions(leftListWhereClauseFields, leftSideListName));
			queryRunnerObj1.SelectProperties = leftListSelectFields;
			queryRunnerObj1.SortFields = [{ Property: 'ListItemID', Direction: '0' }];
			queryRunnerObj1.StartRow = queryRunnerObj1.RowsPerPage * pageNumber;
			queryRunnerObj1.Search(false, d1);
			
			queryRunnerObj2.QueryPath = rightSideJoinListPath;
			queryRunnerObj2.QueryType = queryType.POSTRESTSEARCHQUERY;
			queryRunnerObj2.PropertyRestrictions = String.format(queryRunnerObj2.PropertyRestrictions, self.GetPropertyRestrictions(rightListWhereClauseFields, rightSideListName));
			queryRunnerObj2.SelectProperties = rightListSelectFields;
			queryRunnerObj2.SortFields = [{ Property: 'ProjectIdentity', Direction: '0' }];
			queryRunnerObj2.StartRow = queryRunnerObj2.RowsPerPage * pageNumber;
			queryRunnerObj2.Search(false, d2);
			$.when(d1, d2).done(function (v1, v2) {
				if(v1.d.postquery.PrimaryQueryResult.RelevantResults.TotalRows > 0 && v2.d.postquery.PrimaryQueryResult.RelevantResults.TotalRows > 0)
				{
					var leftListResults = v1.d.postquery.PrimaryQueryResult.RelevantResults.Table.Rows.results;
					var rightListResults = v2.d.postquery.PrimaryQueryResult.RelevantResults.Table.Rows.results;
					joinedResult = self.InnerJoin(queryRunnerObj1, queryRunnerObj2, leftSideJoinField, rightSideJoinField, leftListResults, rightListResults);	
				}
			});
		}
		else if(joinType === joinKind.LEFTOUTER)
		{
			queryRunnerObj1 = new QueryRunner();
			queryRunnerObj2 = new QueryRunner();
			d1 = new $.Deferred();
			d2 = new $.Deferred();
			$.when(d1, d2).done(function (v1, v2) {
			});
		}
		else if(joinType === joinKind.RIGHTOUTER)
		{
			queryRunnerObj1 = new QueryRunner();
			queryRunnerObj2 = new QueryRunner();
			d1 = new $.Deferred();
			d2 = new $.Deferred();
			$.when(d1, d2).done(function (v1, v2) {
			});
		}
		else if(joinType === joinKind.FULLOUTER)
		{
			queryRunnerObj1 = new QueryRunner();
			queryRunnerObj2 = new QueryRunner();
			d1 = new $.Deferred();
			d2 = new $.Deferred();
			$.when(d1, d2).done(function (v1, v2) {
			});
		}
		else
		{	
		}
	};
	
	//This method achieves inner join using hash join algorithm
	self.InnerJoin = function(queryRunnerObj1, queryRunnerObj2, leftSideJoinField, rightSideJoinField, leftListResults, rightListResults)
	{
		var combinedResults = null;
		if(leftListResults.length >= rightListResults.length)
		{
			combinedResults = self.HashJoin(joinKind.INNER, leftListResults, rightListResults, rightSideJoinField, leftSideJoinField);
		}			
		else
		{
			combinedResults = self.HashJoin(joinKind.INNER, rightListResults, leftListResults, leftSideJoinField, rightSideJoinField);
		}
		
		return combinedResults;
	};
	
	//This method represents the hash join algorithm.
	self.HashJoin = function(joinType, largerResult, largeResult, buildPhaseJoinField, probePhaseJoinField)
	{
		var largeHashTable = self.BuildHashTable(largeResult, buildPhaseJoinField);
		combinedResults = self.ProbeHashTable(joinType, largeHashTable, largerResult, probePhaseJoinField);
		return combinedResults;
	};
	
	//This method represents the build phase of hash join algorithm.
	self.BuildHashTable = function(largeResult, joinField)
	{
		var largeHashTable = {};
		for (j = 0; j < largeResult.length; j++) 
		{
			try 
			{
				for (i = 0; i < largeResult[j].Cells.results.length; i++) 
				{
					if (largeResult[j].Cells.results[i].Key == joinField) {
                        largeHashTable[largeResult[j].Cells.results[i].Value] = largeResult[j];
						break;
					}
				}
			}
			catch(ex)
			{
					
			}
		}
		
		return largeHashTable;
	};
	
	//This method represents the probe phase of hash join algorithm.
	self.ProbeHashTable = function(joinType, largeHashTable, largerResult, joinField)
	{
		var combinedResults = [];
		var count = 0;
		for (j = 0; j < largerResult.length; j++) 
		{
			var commonItem = {};
			try 
			{
				for (i = 0; i < largerResult[j].Cells.results.length; i++) 
				{
					if (largerResult[j].Cells.results[i].Key == joinField) {
                        commonItem = largeHashTable[largerResult[j].Cells.results[i].Value];
						if(commonItem !== undefined)
						{
							combinedResults[count++] = [largerResult[j], commonItem];
						}
						
						break;
					}
				}
			}
			catch(ex)
			{
					
			}
		}
		
		return combinedResults;
	};
	
	//This method creates property restriction which are used by search API on server to execute "where" clause of the SQL like queries.
	self.GetPropertyRestrictions = function(userInput, entityName)
	{
		var userSelectedPropRestrictions = '';
		if(userInput !== null)
		{
			for (var i = 0; i < userInput.length; i++) {
				if (typeof userInput[i].Value !== "undefined" && userInput[i].Value !== "" && userInput[i].FieldParentEntity === entityName) {
					userSelectedPropRestrictions = String.format(queryLogicalOperators.AND, String.format(userInput[i].PropertyRestriction, userInput[i].SPManagedProperty, String.addQuotes(userInput[i].Value)), userSelectedPropRestrictions);
				}
			}
		}
		
		if(userSelectedPropRestrictions.length > 0)
		{
			return '(' + userSelectedPropRestrictions.replace(' AND ','') + ')';
		}
		else
		{
			return userSelectedPropRestrictions;
		}
	};
}

/*
	This class encapsulates business logic to execute complex queries on entities "Projects" and "ProjectUsers".
*/
function ContosoProjectSearch()
{
	var self = this;
	
	//This method can be used to read user input values for search fields from user controls. For this example the values have been hard coded.
	self.ReadUserInput = function() {
		var userInput = [];
		var searchField = {};

		searchField["FieldParentEntity"] = "ProjectUsers";
		searchField["SPManagedProperty"] = "ProjectUserNameOWSTEXT";
		searchField["Value"] = "Himanshu"; //$("#selectProjectCategory").find("option:selected").val().trim();
		searchField["LogicalOperator"] = queryLogicalOperators.AND; //$("#selectLogicalOperator").find("option:selected").val().trim();
		searchField["PropertyRestriction"] = propertyRestrictions.equal;
		userInput.push(searchField);
		
		return userInput;
	};
	
	self.GetProjectsForSelectedCriteria = function()
	{
		var userInput = self.ReadUserInput();
		var query = new Query();
		// This query is an example wherein "where" clause has not been used for any of the entity
		query.RunComplexQuery (joinKind.INNER, "Projects", "/Lists/Projects", "ListItemID", "ProjectUsers", "/Lists/ProjectUsers", "ProjectIdentity", null, null, ["ListItemID", "ProjectNameOWSTEXT"], ["ProjectIdentity", "ProjectUserNameOWSTEXT"], 0);
		
		// This query is an example wherein "where" clause has been used for ProjectUsers entity by using the managed property "ProjectUserNameOWSTEXT"
		var query1 = new Query();
		query1.RunComplexQuery (joinKind.INNER, "Projects", "/Lists/Projects", "ListItemID", "ProjectUsers", "/Lists/ProjectUsers", "ProjectIdentity", null, userInput, ["ListItemID", "ProjectNameOWSTEXT"], ["ProjectIdentity", "ProjectUserNameOWSTEXT"], 0);
	};
}

var obj = null;
obj = new ContosoProjectSearch();
