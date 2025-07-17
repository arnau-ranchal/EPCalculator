// disconnect_db.cpp
#include <cmath>
#include <cstring> 
#include "functions.h"
#include <iostream>

extern "C" {
    bool disconnect_db() {
        if(get_db_connect_status()){
            disconnect_from_db();
        }
    }
}
