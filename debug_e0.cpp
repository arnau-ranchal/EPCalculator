#include <iostream>
#include <iomanip>
#include "functions.h"

using namespace std;

int main() {
    cout << fixed << setprecision(10);
    
    // Setup high SNR case
    setN(30);
    setMod(2, "PAM");
    setSNR(50.0);
    setR(0.5);
    setQ();
    setPI();
    setW();
    
    double grad_rho, E0;
    
    // Test at different rho values
    cout << "Testing E_0_co directly at SNR=50, N=30:" << endl;
    
    double rho = 0.5;
    double result = E_0_co(0.5, rho, grad_rho, E0);
    cout << "rho=" << rho << ": E0=" << E0 << ", grad=" << grad_rho << ", return=" << result << endl;
    
    rho = 1.0;
    result = E_0_co(0.5, rho, grad_rho, E0);
    cout << "rho=" << rho << ": E0=" << E0 << ", grad=" << grad_rho << ", return=" << result << endl;
    
    rho = 0.0;
    result = E_0_co(0.5, rho, grad_rho, E0);
    cout << "rho=" << rho << ": E0=" << E0 << ", grad=" << grad_rho << ", return=" << result << endl;
    
    return 0;
}
