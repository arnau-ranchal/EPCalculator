// connect_db.cpp
#include <cmath>
#include <cstring> 
#include "functions.h"
#include <iostream>

extern "C" {
    bool connect_db() {
        if(!get_db_connect_status()){
            connect_to_db();
        }
    }
}
