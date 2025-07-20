// connect_db.cpp
#include <cmath>
#include <cstring>
#include <iostream>
#include "functions.h"

extern "C" {
    bool connect_db() {
        if(!get_db_connect_status()){
            connect_to_db();
        }
    }
}
