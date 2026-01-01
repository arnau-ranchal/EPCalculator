#include <iostream>
#include <iomanip>
#include "functions.h"

using namespace std;

int main() {
    // Test case: SNR=90, N=30
    setN(30);
    setMod(2, "PAM");
    setSNR(90.0);
    setR(0.5);
    setQ();
    setPI();
    setW();
    
    double r = 0.5;
    double rho = 1.0;
    double rho_interp = 0.0;
    
    cout << "Testing GD_iid with SNR=90, N=30" << endl;
    double e0 = GD_iid(r, rho, rho_interp, 20, 30, 1e-6);
    
    cout << fixed << setprecision(10);
    cout << "Result: E0 = " << e0 << ", rho = " << rho << endl;
    
    return 0;
}
