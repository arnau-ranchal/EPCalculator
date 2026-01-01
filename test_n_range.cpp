#include <iostream>
#include <iomanip>
#include "functions.h"

using namespace std;

void test_N(int N) {
    setN(N);
    setMod(2, "PAM");
    setSNR(5.0);
    setR(0.5);
    setQ();
    setPI();
    setW();
    
    double grad_rho, E0;
    double result = E_0_co(0.5, 0.5, grad_rho, E0);
    
    cout << "N=" << setw(3) << N << ": ";
    if (result > 0) {
        cout << "E0=" << fixed << setprecision(8) << E0 << ", grad=" << grad_rho << endl;
    } else {
        cout << "FAILED (E0=" << E0 << ")" << endl;
    }
}

int main() {
    vector<int> N_values = {15, 20, 30, 40, 99, 100, 101, 200, 300, 500};
    
    for (int N : N_values) {
        test_N(N);
    }
    
    return 0;
}
