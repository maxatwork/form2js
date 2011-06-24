# form2js
_Convenient way to collect form data into JavaScript object._

[Example]: http://form2js.googlecode.com/hg/example/test.html

It's highly recommended to use latest version from repository instead of archives in "Downloads" section.

If you have any questions/suggestions or find out something weird or illogical - feel free to post an issue.

## Details

Structure of resulting object defined by "name" attribute of form fields. See examples below.

This is **not** a serialization library. Library used in example for JSON serialization is http://www.json.org/js.html 

All this library doing is collecting form data and putting it in javascript object (obviously you can get JSON/XML/etc string by serializing it, but it's not an only purpose).

## Usage

### Objects/nested objects
Structure of resulting object defined in "name" attribute, delimiter is "." (dot) by default, but can be changed.

    <input type="text" name="person.name.first" value="John" />
    <input type="text" name="person.name.last" value="Doe" />

becomes

    {
        "person" :
        {
            "name" :
            {
                "first" : "John",
                "last" : "Doe"
            }
        }
    }

###Arrays
Several fields with the same name with brackets defines array of values.

    <label><input type="checkbox" name="person.favFood[]" value="steak" checked="checked" /> Steak</label>
    <label><input type="checkbox" name="person.favFood[]" value="pizza"/> Pizza</label>
    <label><input type="checkbox" name="person.favFood[]" value="chicken" checked="checked" /> Chicken</label>

becomes

    {
        "person" :
        {
            "favFood" : [ "steak", "chicken" ]
        }
    }

###Arrays of objects/nested objects
Same index means same item in resulting array. Index doesn't specify order (order of appearance in document will be used).

    <dl>
        <dt>Give us your five friends' names and emails</dt>
        <dd>
            <label>Email <input type="text" name="person.friends[0].email" value="agent.smith@example.com" /></label>
            <label>Name <input type="text" name="person.friends[0].name" value="Smith Agent"/></label>
        </dd>
        <dd>
            <label>Email <input type="text" name="person.friends[1].email" value="n3o@example.com" /></label>
            <label>Name <input type="text" name="person.friends[1].name" value="Thomas A. Anderson" /></label>
        </dd>
    </dl>

becomes

    {
        "person" :
        {
            "friends" : [
                { "email" : "agent.smith@example.com", "name" : "Smith Agent" },
                { "email" : "n3o@example.com", "name" : "Thomas A. Anderson" }
            ]
        }
    }

##Why not to use jQuery .serializeArray() and similar functions in other frameworks instead?
.serializeArray() works a bit different. It makes this structure from markup in previous example:

    [
        { "person.friends[0].email" : "agent.smith@example.com" },
        { "person.friends[0].name" : "Smith Agent" },
        { "person.friends[1].email" : "n3o@example.com" },
        { "person.friends[1].name" : "Thomas A. Anderson" }
    ]