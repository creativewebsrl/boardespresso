#!/usr/bin/env python
import sys
from CGIHTTPServer import CGIHTTPRequestHandler
from BaseHTTPServer import HTTPServer

class MyRequestHandler(CGIHTTPRequestHandler):
    # In this directory we will insert our scripts
    cgi_directories=["/cgi-bin"]

"""Start a web server on localhost
    
    Keyword arguments:
    port -- port number (reach it like http://localhost:port/ )
"""
def run(port=8000):
    http_server=HTTPServer(('', port), MyRequestHandler)
    http_server.serve_forever()

if __name__=="__main__":
    print "Starting Server"
    run()