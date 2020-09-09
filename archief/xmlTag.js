(function ()
{
    
/*
    Defines an xmlTag object that will be used as the main data carrier in the editor;
*/
angular.module('confab')

    .factory('xmlTag', function() 
        {
        /*
        tagTypes are "STARTTAG", "COMBITAG", and "ENDTAG"
        */

        var staticPipenames = ["FixedQuerySender", "XmlWellFormedChecker","XmlValidator","XmlSwitch","XmlIf","WsdlXmlValidator","RemoveFromSession","PutSystemDateInSession","PutInSession","MailSender","LogSender","Json2XmlValidator","JmsCommunicator","PutParametersInSession","IsolatedServiceExecutor","IsolatedServiceCaller","IfMultipart","GetFromSession","FixedResultSender","FixedResult","FilenameSwitch","XmlParamSwitch","EchoSender"];


        function xmlTag(elementname, proparray) 
        {
            this.tagType = "STARTTAG";
            this.elementName = elementname;
            tagProperties = {};
            proparray.forEach(function(prop)
            {
                tagProperties[prop.getAttributeName()] = prop.getAttributeValues();
            }); 
            this.tagProperties = tagProperties; 
        }
        //native functions of the xmlTag that can access the instance properties
        xmlTag.prototype = 
        {
            getTagType : function()
            {
                return this.tagType;
            },
            setTagType : function(astring)
            {
                switch (astring)
                {
                    case "STARTTAG":{this.tagType = "STARTTAG"; break;}
                    case "COMBITAG":{this.tagType = "COMBITAG";break;}
                    case "ENDTAG":{this.tagType = "ENDTAG";break;}
                    default :{console.log("tagType is set to default..",astring," is unknown type.");
                                this.tagType = "STARTTAG";}
                }
            },
            toCompleteTag : function()
            {
                var returnstring = "";  
                var itsproperties = ""; 
                this.convertToPipe();
                angular.forEach(this.tagProperties, function(value, key)
                {
                    if (value == "")
                    {
                        itsproperties += " " + key + "=\"\" " + " ";
                    }
                    else
                    {
                        itsproperties += " " + key + "=\"" + value + '\"';   
                    }

                });
             returnstring =                     "<" + 
                                        this.elementName + 
                                        itsproperties + 
                                        "></" +
                                        this.elementName + 
                                        ">" ;
                                           

             return returnstring;                           


            },
            //converts its contents to a readable xml-tag, dependent on its type
            toObject : function()
            {
                var theobject = {} ;
                theobject[this.elementName] = this.tagProperties;
                console.log("myobj", theobject);
                return theobject;
            },
            setProperty :function (key, value)
            {
                this.tagProperties[key] = value;
            },
            getPropertyValue :function (key)
            {
                return this.tagProperties[key];
            },
            //necessary while waiting for new IAF release; for now these elements have
            //a default classname attached.
            convertToPipe: function()
            {
                if (this.elementName.search( /^.*Pipe$/ ) !== -1)
                {
                    this.elementName = "pipe"; 
                }

                if(staticPipenames.includes(this.elementName))
                {
                    this.elementName = "pipe";    
                }

                var regex = "/^.*Pipe$/";

            }

        };
       /*static functions that have no access to this:
        xmlTag.computeTabdistance = function(tag)
        {
            return tabdistance
        }
       */
        return (xmlTag);
        })

    .factory('attributeObject', function()
    {
        function attributeObject(attributename, values, hasDefault)
        {
            this.name = attributename;
            
            if(values !== undefined)
            {
                this.values = values;
            }
            else
            {
                this.values = [];
            }
            if (hasDefault !== undefined)
            {
                this.hasDefault = hasDefault;
            }
            else 
            {
                this.hasDefault = false;
            }
        }

        attributeObject.prototype = 
        {
            setAttributeValue : function(value)
            {
                if (this.hasDefault)
                {
                    this.values.unShift(value);
                }
                else 
                {
                    this.values.push(value);
                }
            },

            //insert a whole array
            insertValues : function(array)
            {
               this.values = array; 
            },

            getAttributeName : function()
            {
                return this.name;
            },

            //returns an array of possible values 
            getAttributeValues : function()
            {
                return this.values;
            },
            
            setDefaultValue : function(bool)
            {
                this.hasDefault = bool ;
            },

            toString : function()
            {
                return this.name + 'Allowed values:' + this.values.join();
            }
        };


        return(attributeObject);

        





    });

})();