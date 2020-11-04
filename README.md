# Manaco XSD Code Completion

This is a basic and low resource way to provide client-side code completion and other features for the Monaco-editor. 
The code completion is based on the XSD that is provided to the XsdManager. It is possible to use multiple XSD's, and namespaces.

ToDo:

-   [x] Parse XSD
-   [x] Code completion based on XSD
-   [x] Cache code suggestions
-   [x] Autocomplete close tags
-   [x] Insert element als snippit (or tamplate)
-   [x] Auto indentation ([RP for Monaco-languages](https://github.com/microsoft/monaco-languages/pull/113))
-   [x] Implement namespaces
    -   [x] Get suggestions from multiple XSD's
    -   [x] Append namespace to suggestions
-   [ ] Performance optimalisation
    -   [ ] Change parser to SAX
    -   [ ] Make use of the Monaco workers for parralel parsing
-   [ ] Template based on XSD
-   [ ] Show syntax errors
