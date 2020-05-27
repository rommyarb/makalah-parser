# Server is using:
- GROBID as service, with endpoint: `https://grobid.rommyarb.dev`
- Full API documentation: [https://grobid.readthedocs.io/en/latest/Grobid-service](https://grobid.readthedocs.io/en/latest/Grobid-service)

# Web is using:
- VueJS
- FontAwesome Kit

# How it works:
1. Upload 1 or more PDF files.
2. GROBID service will parse your PDFs into XML documents (returns XML files).
3. The web will parse/convert it into JSON format.
4. Profit?