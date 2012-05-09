boardEspresso
=============

A cool dashboard to monitor whatever you need.

Dependencies
------------

On debian-like distributions ensure you have the following packages
git-core build-essential curl openssl libssl-dev 

On other distributions you'll have to find their equivalent.

Notice that you will need a mongodb database to connect to.

Install
-------

Suppose you want to install bordEspresso at /opt/boardespresso
(note that you should use the latest 0.6.x nodejs version)
    
    mkdir /opt/boardespresso
    cd /opt/boardespresso
    git clone git@github.com:creativewebsrl/boardespresso.git .
    ./init.sh . v0.6.17

Follow evenctual instructions given when the script ends.

Copyright
---------

Copyright Creative Web Srl <info@creativeweb.it> [http://www.creativeweb.it]

