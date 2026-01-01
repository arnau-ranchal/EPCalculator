#include <iostream>
#include <iomanip>
#include "functions.h"

using namespace std;

int main() {
    cout << fixed << setprecision(10);
    
    // Test with N=500
    cout << "Setting up for N=500..." << endl;
    setN(500);
    setMod(2, "PAM");
    setSNR(5.0);
    setR(0.5);
    setQ();
    setPI();
    setW();
    cout << "Setup complete." << endl;
    
    double grad_rho, E0;
    
    cout << "\nTesting E_0_co at rho=0:" << endl;
    double result = E_0_co(0.5, 0.0, grad_rho, E0);
    cout << "  E0=" << E0 << ", grad=" << grad_rho << ", return=" << result << endl;
    
    cout << "\nTesting E_0_co at rho=0.5:" << endl;
    result = E_0_co(0.5, 0.5, grad_rho, E0);
    cout << "  E0=" << E0 << ", grad=" << grad_rho << ", return=" << result << endl;
    
    cout << "\nTesting E_0_co at rho=1.0:" << endl;
    result = E_0_co(0.5, 1.0, grad_rho, E0);
    cout << "  E0=" << E0 << ", grad=" << grad_rho << ", return=" << result << endl;
    
    return 0;
}
