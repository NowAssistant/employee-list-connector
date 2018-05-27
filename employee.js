const api = require('./api');


module.exports = async function (activity) {

    try {
        
        api.initialize(activity);  

        if(activity.Request.Path && activity.Request.Action=="Get") {

            // item: Id is provided in path e.g. .../CustomerLookup/123 = Path "123"

            // *todo* create a simple and fast API request
            const response = await api('/' );
            
            if((!response || response.statusCode != 200)) {
                activity.Response.ErrorCode = response.statusCode || 500;
                activity.Response.Data ={ ErrorText: "request failed" };           
            } else {                                  
                // return response
                activity.Response.Data = convert_item(response.body);
            }

        } else {

            var action = "firstpage";

            // items: search
            let searchQuery = activity.Request.Query.query || "";
            let page = parseInt(activity.Request.Query.page) || 1;
            let pageSize = parseInt(activity.Request.Query.pageSize) || 20;

            // nextpage request
            if((activity.Request.Data && activity.Request.Data.args && activity.Request.Data.args.atAgentAction=="nextpage")) {
                page = parseInt(activity.Request.Data.args._page) || 2;
                pageSize = parseInt(activity.Request.Data.args._pageSize) || 20;
                action = "nextpage";
            }


            if(page<0) page=1;
            if(pageSize<1 || pageSize>99) pageSize=20;

            // *todo* append query & pagination parameters as needed
            let url = "/?seed=adenin";
            url += "&page=" + page;
            url += "&results=" + pageSize;
            url += "&inc=name,email,location,picture"

            const response = await api(url);

            if((!response || response.statusCode != 200)) {
                activity.Response.ErrorCode = response.statusCode || 500;
                activity.Response.Data ={ ErrorText: "request failed" };           

            } else {                                  
                
                // *todo* customize as needed
                let items = response.body.results;
                activity.Response.Data._action = action;
                activity.Response.Data._page = page;
                activity.Response.Data._pageSize = pageSize;
                activity.Response.Data.items = [];

                for(let i=0;i<items.length;i++) {
                    let item = convert_item(items[i]);
                    activity.Response.Data.items.push(item);
                }
                
            }
        }


    } catch (error) {

        // return error response
        var m = error.message;    
        if (error.stack) m = m + ": " + error.stack;

        activity.Response.ErrorCode = (error.response && error.response.statusCode) || 500;
        activity.Response.Data = { ErrorText: m };

    }


    
    function convert_item(_item) {

        var item = {};

        // *todo* convert item as needed
        let id = _item.picture.large;
        id = id.substring(id.lastIndexOf("/")+1); // extract id from image name
        item.id = id.substring(0,id.indexOf("."));

        item.title = _item.name.first + " " + _item.name.last;
        item.description = _item.email;
        item.picture = _item.picture.large;

        return item;

    }

};
